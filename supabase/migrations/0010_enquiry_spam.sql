-- Makes the spam verdict a property of the row, and stops a flood from spending
-- the allowance real customers need.
--
-- Written during one. For two days the contact form took a submission every
-- minute from a distributed bot — an OZON prize scam in Cyrillic, sent through a
-- Slovak robotics site — and the two defences already in place both behaved
-- exactly as designed while achieving nothing:
--
--   * the honeypot never fired, because the bot fills only the fields it can see;
--   * the per-address limit never fired, because the attempts came from sixteen
--     addresses, each staying politely under it;
--   * the global limit *did* fire, continuously, which was the real damage. Held
--     at its cap of sixty an hour it stopped being a brake and became a valve:
--     1440 messages a day let through, and every hour's allowance already spent
--     by the time a customer in Žilina pressed Send. They were told to try later.
--
-- Two changes follow from that, and they are the whole of this migration.
--
-- **A submission carries its verdict.** `spam` is set by lib/spam.ts before
-- anything is sent, and a flagged row is stored and never mailed. Stored, not
-- discarded, because a classifier that silently drops what it misjudges is one
-- nobody can correct — `spam_reason` keeps the arithmetic that produced the
-- verdict so a wrong one can be argued with.
--
-- **The ledger counts by kind.** `enquiry_attempts.kind` separates the two
-- populations, so the global limit on real enquiries is no longer consumed by
-- spam that was never going to be delivered. That is what lets the clean limit
-- come down to something protective instead of merely large.

alter table public.enquiries
  add column if not exists spam boolean not null default false;

alter table public.enquiries
  add column if not exists spam_reason text;

comment on column public.enquiries.spam is
  'Classified as spam by lib/spam.ts. No mail was sent for this row. Hidden from the default admin list, kept briefly so a misjudgement stays visible.';

comment on column public.enquiries.spam_reason is
  'The score and the signals that produced it, e.g. "8: foreign-script, link, shortener". For arguing with the classifier.';

-- The admin list reads real enquiries, newest first, and now has to skip a
-- population that may be far larger than it. Partial, because the spam rows are
-- read only when somebody deliberately asks for them.
create index if not exists enquiries_real_idx
  on public.enquiries (created_at desc)
  where not spam;

-- The two existing indexes describe the whole table, which now means they promise
-- an ordering over rows the list never shows. Rebuilt as partial so the open-items
-- query cannot walk six hundred blocked submissions to find four real ones.
drop index if exists public.enquiries_open_idx;
create index if not exists enquiries_open_idx
  on public.enquiries (created_at desc)
  where not handled and not spam;

-- Which population an attempt belongs to. Defaulted, so the rows already in the
-- ledger keep counting as what they were assumed to be.
alter table public.enquiry_attempts
  add column if not exists kind text not null default 'clean';

comment on column public.enquiry_attempts.kind is
  'clean | spam. The global limit counts within one kind, so a flood of the second cannot exhaust the allowance for the first.';

-- Both windows are now asked per kind.
drop index if exists public.enquiry_attempts_time_idx;
create index if not exists enquiry_attempts_kind_time_idx
  on public.enquiry_attempts (kind, created_at desc);

/**
 * Counts and records in one statement, per kind.
 *
 * The per-address window deliberately still counts *every* kind: a source that
 * has been flooding does not earn a fresh allowance by sending something that
 * happens to read cleanly. Only the global window narrows to the caller's own
 * kind, which is the entire point — a bot's traffic is bounded by the bot's
 * budget, and the customers' budget is theirs alone.
 *
 * Returns {"allowed": true} or {"allowed": false, "reason": "ip"|"global"}.
 */
create or replace function public.record_enquiry_attempt(
  hash text,
  market text,
  attempt_kind text,
  ip_limit integer,
  ip_window interval,
  global_limit integer,
  global_window interval
) returns jsonb
language plpgsql
as $$
declare
  ip_count integer;
  total_count integer;
begin
  -- Opportunistic housekeeping, as before: the ledger only ever needs the
  -- longest window, and doing it here avoids a scheduled job for one small table.
  delete from public.enquiry_attempts
   where created_at < now() - greatest(ip_window, global_window) - interval '1 hour';

  select count(*) into ip_count
    from public.enquiry_attempts
   where ip_hash = hash and created_at > now() - ip_window;

  if ip_count >= ip_limit then
    return jsonb_build_object('allowed', false, 'reason', 'ip');
  end if;

  select count(*) into total_count
    from public.enquiry_attempts
   where kind = attempt_kind and created_at > now() - global_window;

  if total_count >= global_limit then
    return jsonb_build_object('allowed', false, 'reason', 'global');
  end if;

  insert into public.enquiry_attempts (ip_hash, locale, kind)
  values (hash, market, attempt_kind);

  return jsonb_build_object('allowed', true);
end;
$$;

comment on function public.record_enquiry_attempt(text, text, text, integer, interval, integer, interval) is
  'Checks both rate limits for one kind of attempt and records it atomically. Returns {allowed, reason}.';

revoke execute on function
  public.record_enquiry_attempt(text, text, text, integer, interval, integer, interval)
  from public, anon, authenticated;

grant execute on function
  public.record_enquiry_attempt(text, text, text, integer, interval, integer, interval)
  to service_role;

/**
 * The kindless signature, kept as a bridge and nothing more.
 *
 * Dropping it here was the first instinct and it was wrong. Migrations are
 * applied before the build that needs them is live, and this one is being applied
 * *during* the flood it is meant to stop — so between the migration and the
 * deploy the running build would call a function that no longer exists, the
 * limiter would fail open exactly as it is designed to, and the only thing still
 * holding the bot to sixty an hour would be gone. The window would be whatever
 * gap there is between two commands, spent at full speed, relaying scam mail to
 * strangers.
 *
 * So it delegates instead. The previous build keeps the behaviour it had, charged
 * to the clean budget as it always was, and the sixty-an-hour cap it passes stays
 * in force until the build that knows better replaces it.
 *
 * Delete it in a later migration, once the new build is live. It has no callers
 * then, and leaving a second entry point around indefinitely is how the next
 * person comes to believe there are two ways this works.
 */
create or replace function public.record_enquiry_attempt(
  hash text,
  market text,
  ip_limit integer,
  ip_window interval,
  global_limit integer,
  global_window interval
) returns jsonb
language sql
as $$
  select public.record_enquiry_attempt(
    hash, market, 'clean', ip_limit, ip_window, global_limit, global_window
  );
$$;

comment on function public.record_enquiry_attempt(text, text, integer, interval, integer, interval) is
  'Deployment bridge for builds predating enquiry_attempts.kind. Delegates as kind=clean. Drop once no build calls it.';

revoke execute on function
  public.record_enquiry_attempt(text, text, integer, interval, integer, interval)
  from public, anon, authenticated;

grant execute on function
  public.record_enquiry_attempt(text, text, integer, interval, integer, interval)
  to service_role;
