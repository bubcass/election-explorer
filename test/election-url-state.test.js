import test from "node:test";
import assert from "node:assert/strict";

import {
  buildElectionUrl,
  constituencySlug,
  resolveElectionUrlState,
} from "../src/components/election-url-state.js";

const defaults = {
  constituency: "Carlow-Kilkenny",
  election: "2024-general-election",
};

const rows = [
  {
    constituency: "Carlow-Kilkenny",
    election: "2024-general-election",
    electionDate: "2024-11-29",
    electionType: "general election",
  },
  {
    constituency: "Galway West",
    election: "2024-general-election",
    electionDate: "2024-11-29",
    electionType: "general election",
  },
  {
    constituency: "Galway West",
    election: "2026-galway-west-byelection",
    electionDate: "2026-05-22",
    electionType: "by-election",
  },
];

test("creates stable constituency slugs", () => {
  assert.equal(constituencySlug("Dún Laoghaire"), "dun-laoghaire");
  assert.equal(constituencySlug("Carlow–Kilkenny"), "carlow-kilkenny");
});

test("resolves an explicit constituency and election", () => {
  assert.deepEqual(
    resolveElectionUrlState({
      rows,
      search: "?constituency=galway-west&election=2026-galway-west-byelection",
      defaults,
    }),
    {
      constituency: "Galway West",
      election: "2026-galway-west-byelection",
    }
  );
});

test("uses the general election when only a constituency is supplied", () => {
  assert.deepEqual(
    resolveElectionUrlState({
      rows,
      search: "?constituency=galway-west",
      defaults,
    }),
    {
      constituency: "Galway West",
      election: "2024-general-election",
    }
  );
});

test("falls back safely when URL values are unknown or incompatible", () => {
  assert.deepEqual(
    resolveElectionUrlState({
      rows,
      search: "?constituency=unknown&election=2026-galway-west-byelection",
      defaults,
    }),
    defaults
  );
});

test("builds a canonical URL while preserving unrelated parameters and hashes", () => {
  const url = buildElectionUrl(
    {
      constituency: "Galway West",
      election: "2026-galway-west-byelection",
    },
    "https://bubcass.github.io/election-explorer/?ref=homepage#results"
  );

  assert.equal(
    url.href,
    "https://bubcass.github.io/election-explorer/?ref=homepage&constituency=galway-west&election=2026-galway-west-byelection#results"
  );
});
