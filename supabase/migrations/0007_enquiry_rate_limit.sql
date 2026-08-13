-- Caps how often the contact form may send.
--
-- The form is the one unauthenticated endpoint on this site that can send mail,
-- and the account it sends from is the client's own company mailbox. A flood
-- would not merely fill an inbox: the provider can throttle or suspend an
-- account that emits a thousand messages in an hour, which would take the real
-- enquiries down with it. That is the damage this table exists to bound.
--
-- Two limits, because they stop different things. The per-address limit stops
-- one source hammering the form; the global one protects the sending account
-- even when the attempts are spread across many addresses, where a per-address
-- limit never triggers.
--
-- **No IP address is stored.** `ip_hash` is a SHA-256 of the address with a
-- server-side pepper. Counting attempts needs only a stable token, not the
-- address, and an unpeppered hash of an IPv4 address is worthless as protection
-- — the whole space is four billion values and brute-forces in seconds. With the
-- pepper the column cannot be turned back into "who visited".
--
-- RLS is enabled with no policies: only the server, with the secret key, ever
-- touches this.

create table if not exists public.enquiry_attempts (
  id bigserial primary key,
  -- SHA-256(pepper + address). Never the address itself.
  ip_hash text not null,
  locale text not null,
  created_at timestamptz not null default now()
);

-- The two questions asked on every submission.
create index if not exists enquiry_attempts_ip_idx
  on public.enquiry_attempts (ip_hash, created_at desc);

create index if not exists enquiry_attempts_time_idx
  on public.enquiry_attempts (created_at desc);

alter table public.enquiry_attempts enable row level security;

comment on table public.enquiry_attempts is
  'Rate-limit ledger for the contact form. Holds peppered hashes, never addresses. Server-side access only; RLS denies all client roles.';

/**
 * Counts and records in one statement.
 *
 * Doing this as two round trips would let a burst through the gap between the
 * count and the insert, which is exactly the traffic pattern this is meant to
 * stop. The limits are arguments rather than constants so they can be tuned in
 * lib/rate-limit.ts without another migration.
 *
 * Returns {"allowed": true} or {"allowed": false, "reason": "ip"|"global"}.
 */
create or replace function public.record_enquiry_attempt(
  hash text,
  market text,
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
  -- Opportunistic housekeeping: the ledger only ever needs the longest window,
  -- and doing it here avoids a scheduled job for one small table.
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
   where created_at > now() - global_window;

  if total_count >= global_limit then
    return jsonb_build_object('allowed', false, 'reason', 'global');
  end if;

  insert into public.enquiry_attempts (ip_hash, locale) values (hash, market);
  return jsonb_build_object('allowed', true);
end;
$$;

comment on function public.record_enquiry_attempt(text, text, integer, interval, integer, interval) is
  'Checks both rate limits and records the attempt atomically. Returns {allowed, reason}.';

-- Called only with the secret key. Postgres grants EXECUTE to PUBLIC on a new
-- function and Supabase hands anon and authenticated a grant of their own, so
-- both have to be named — and the grant back to service_role is just as
-- necessary, since `bypassrls` gets that role past the table's policies, not
-- past a missing EXECUTE.
revoke execute on function
  public.record_enquiry_attempt(text, text, integer, interval, integer, interval)
  from public, anon, authenticated;

grant execute on function
  public.record_enquiry_attempt(text, text, integer, interval, integer, interval)
  to service_role;
