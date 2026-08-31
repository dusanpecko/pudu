import assert from "node:assert/strict";
import { test } from "node:test";

import { importSnippet } from "./helpers.ts";

/**
 * The set of hostnames a Turnstile token is allowed to have been solved on.
 *
 * This is tested for one reason above the others: **the check it feeds is
 * disabled outside production**, because Cloudflare's testing sitekeys report a
 * hostname of `example.com` and no action at all. So a mistake here is invisible
 * on a developer's machine and on every preview, and shows up as every enquiry on
 * every live domain being refused — the failure nobody sees coming.
 *
 * What it has to get right is unglamorous. The site redirects bare domains to
 * `www`, and the token carries whichever host the visitor actually stood on, so
 * both spellings have to be present whichever way the environment variable is
 * written. Getting that wrong in one direction blocks everybody; in the other it
 * silently accepts nothing extra, because a hostname is either ours or it is not.
 */

type Module = { originHostnames: (origins: readonly string[]) => Set<string> };

async function load(): Promise<Module["originHostnames"]> {
  const mod = await importSnippet<Module>(
    "lib/turnstile.ts",
    /export function originHostnames[\s\S]*?\n\}/,
    (snippet) => snippet,
    "origin-hostnames",
  );
  return mod.originHostnames;
}

test("both spellings, whichever way the origin is written", async () => {
  const originHostnames = await load();

  // The real variables of this project: three markets carry `www`, one does not.
  const hosts = originHostnames([
    "https://www.pududotoho.sk",
    "https://pududotoho.cz",
    "https://www.puduindustrial.com",
    "https://www.puduindustrial.de",
  ]);

  for (const domain of [
    "pududotoho.sk",
    "pududotoho.cz",
    "puduindustrial.com",
    "puduindustrial.de",
  ]) {
    assert.ok(hosts.has(domain), `bare ${domain} missing`);
    assert.ok(hosts.has(`www.${domain}`), `www.${domain} missing`);
  }
  assert.equal(hosts.size, 8);
});

test("a host that is not ours is not in the set", async () => {
  const originHostnames = await load();
  const hosts = originHostnames(["https://www.pududotoho.sk"]);

  for (const hostile of [
    // What a token solved on somebody else's machine reports, and the reason the
    // check exists at all: a sitekey is public.
    "localhost",
    "127.0.0.1",
    // What Cloudflare's dummy sitekey reports.
    "example.com",
    // A preview deployment.
    "pudu-git-main.vercel.app",
    // The lookalikes: a suffix match or a naive `includes` would accept all three.
    "pududotoho.sk.evil.com",
    "notpududotoho.sk",
    "evil-pududotoho.sk",
  ]) {
    assert.equal(hosts.has(hostile), false, hostile);
  }
});

test("a subdomain is not covered, and that is deliberate", async () => {
  const originHostnames = await load();
  const hosts = originHostnames(["https://pududotoho.sk"]);

  // Turnstile's *widget* accepts subdomains of a listed hostname; this set does
  // not, because it answers a narrower question — not "may this widget run here"
  // but "is this one of the hosts we serve the form from". A new subdomain that
  // ought to be trusted arrives with its own site-URL variable.
  assert.equal(hosts.has("staging.pududotoho.sk"), false);
  assert.deepEqual([...hosts].sort(), ["pududotoho.sk", "www.pududotoho.sk"]);
});

test("a malformed origin costs only itself", async () => {
  const originHostnames = await load();

  // The important half of this: one unset or fat-fingered variable must not empty
  // the allowlist, because an empty allowlist refuses every enquiry on every
  // domain.
  const hosts = originHostnames([
    "https://www.pududotoho.sk",
    "not a url",
    "",
    "pududotoho.cz", // no scheme, so not parseable as an origin
  ]);

  assert.deepEqual([...hosts].sort(), ["pududotoho.sk", "www.pududotoho.sk"]);
});

test("no origins yields no hostnames rather than throwing", async () => {
  const originHostnames = await load();
  assert.equal(originHostnames([]).size, 0);
});

test("a port on the origin does not follow the hostname", async () => {
  const originHostnames = await load();

  // `URL.hostname` excludes the port while `host` includes it, and siteverify
  // reports a hostname. Picking the wrong property would break local and any
  // non-standard-port deployment.
  const hosts = originHostnames(["http://localhost:3000"]);
  assert.deepEqual([...hosts].sort(), ["localhost", "www.localhost"]);
});
