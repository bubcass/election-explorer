import fs from "node:fs/promises";

const API_URL =
  "https://api.oireachtas.ie/v1/members?date_start=2024-11-15&chamber=dail&house_no=34";
const OUTPUT_PATH = "src/data/members-lookup.json";

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

async function fetchAllRows(baseUrl, limit = 1000) {
  const rows = [];
  let expected = null;

  for (let skip = 0; ; skip += limit) {
    const url = new URL(baseUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("skip", String(skip));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const payload = await response.json();
    const batch = Array.isArray(payload?.results) ? payload.results : [];
    const resultCount = Number(payload?.head?.counts?.resultCount);
    if (Number.isFinite(resultCount)) expected = resultCount;

    rows.push(...batch);
    if (!batch.length || batch.length < limit || (expected !== null && rows.length >= expected)) {
      break;
    }
  }

  if (expected !== null && rows.length < expected) {
    throw new Error(`Incomplete members response: expected ${expected}, received ${rows.length}`);
  }

  return rows;
}

function latestDailMembership(member) {
  const memberships = (member?.memberships ?? [])
    .map((item) => item?.membership)
    .filter((membership) => clean(membership?.house?.showAs) === "34th Dáil");

  return memberships.at(-1) ?? null;
}

function committeeNames(membership) {
  return (membership?.committees ?? []).map((item) => {
    const name = item?.committeeName?.[0]?.nameEn ?? "Unnamed Committee";
    const role = item?.role?.title;
    return role ? `${name} (${role})` : name;
  });
}

function buildLookup(rows) {
  const lookup = {};

  for (const row of rows) {
    const member = row?.member;
    const membership = latestDailMembership(member);
    const memberCode = member?.memberCode;
    if (!memberCode || !membership) continue;

    const representation = membership?.represents?.[0]?.represent;
    const party = membership?.parties?.at(-1)?.party;

    lookup[memberCode] = {
      memberCode,
      memberName: member?.fullName ?? null,
      house: membership?.house?.showAs ?? null,
      constituency: representation?.showAs ?? null,
      constituencyCode: representation?.representCode ?? null,
      party: party?.showAs ?? null,
      partyCode: party?.partyCode ?? null,
      startDate: membership?.dateRange?.start ?? null,
      endDate: membership?.dateRange?.end ?? null,
      committees: committeeNames(membership),
      memberUrl: `https://www.oireachtas.ie/en/members/member/${memberCode}/`
    };
  }

  return lookup;
}

const fixturePath = process.argv[2];
const rows = fixturePath
  ? JSON.parse(await fs.readFile(fixturePath, "utf8"))?.results ?? []
  : await fetchAllRows(API_URL);
const lookup = buildLookup(rows);

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(lookup, null, 2)}\n`);
console.log(`Wrote ${Object.keys(lookup).length} members to ${OUTPUT_PATH}`);
