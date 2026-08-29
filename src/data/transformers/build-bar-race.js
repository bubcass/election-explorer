#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { csvParse } from "d3-dsv";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node build-bar-race.js <input.csv> <output.json>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");

const rows = csvParse(raw, (d) => ({
  election: d.election || "2024-general-election",
  electionLabel: d.election_label || "2024 general election",
  electionDate: d.election_date || "2024-11-29",
  name: d.candidate,
  gender: d.gender,
  party: d.party,
  count: Number(d.count),
  transfer: Number(d.transfer) || 0,
  value: Number(d.total),
  condition: d.condition || "Continuing",
  constituency: d.constituency_x,
  quota: Number(d.quota),
  seats: Number(d.seats),
}));

const byElectionAndConstituency = new Map();

for (const row of rows) {
  if (!row.constituency) continue;

  const key = `${row.election}|||${row.constituency}`;
  if (!byElectionAndConstituency.has(key)) {
    byElectionAndConstituency.set(key, []);
  }

  byElectionAndConstituency.get(key).push(row);
}

const output = Array.from(byElectionAndConstituency, ([, records]) => {
  const election = records[0]?.election ?? "";
  const electionLabel = records[0]?.electionLabel ?? "";
  const electionDate = records[0]?.electionDate ?? "";
  const constituency = records[0]?.constituency ?? "";
  const quota = records[0]?.quota ?? 0;
  const seats = records[0]?.seats ?? 0;
  const maxValue = Math.max(...records.map((d) => d.value));
  const maxCount = Math.max(...records.map((d) => d.count));

  const candidates = Array.from(
    new Map(
      records.map((d) => [
        d.name,
        {
          name: d.name,
          party: d.party,
          gender: d.gender,
        },
      ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const countsMap = new Map();

  for (const row of records) {
    if (!countsMap.has(row.count)) {
      countsMap.set(row.count, {
        count: row.count,
        values: {},
        transfers: {},
        status: {},
      });
    }

    const frame = countsMap.get(row.count);
    frame.values[row.name] = row.value;
    frame.transfers[row.name] = row.transfer;
    frame.status[row.name] = row.condition;
  }

  const counts = Array.from(countsMap.values()).sort(
    (a, b) => a.count - b.count,
  );

  return {
    election,
    electionLabel,
    electionDate,
    constituency,
    quota,
    seats,
    maxValue,
    maxCount,
    candidates,
    counts,
  };
}).sort((a, b) =>
  a.electionDate.localeCompare(b.electionDate) ||
  a.constituency.localeCompare(b.constituency)
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`Built bar-race data for ${output.length} constituencies`);
console.log(`Saved to ${outputPath}`);
