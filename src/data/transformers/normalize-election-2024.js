import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as d3 from "d3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, "../election_results.csv");
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../derived/election-results-normalised.json",
);

function cleanString(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normaliseStatus(value) {
  const cleaned = cleanString(value);

  const map = new Map([
    ["continuing", "Continuing"],
    ["elected", "Elected"],
    ["eliminated", "Eliminated"],
    ["excluded", "Eliminated"],
  ]);

  return map.get(cleaned.toLowerCase()) ?? cleaned;
}

function normaliseParty(value) {
  const cleaned = cleanString(value);
  if (!cleaned) return "Unknown";

  const map = new Map([
    ["Non-party", "Independent"],
    ["Independent", "Independent"],
  ]);

  return map.get(cleaned) ?? cleaned;
}

function normaliseGender(value) {
  const cleaned = cleanString(value).toUpperCase();

  if (cleaned === "M") return "M";
  if (cleaned === "F") return "F";

  return cleaned || null;
}

function sortRows(a, b) {
  return (
    d3.ascending(a.electionDate, b.electionDate) ||
    d3.ascending(a.constituency, b.constituency) ||
    d3.ascending(a.count, b.count) ||
    d3.ascending(a.name, b.name)
  );
}

async function main() {
  const csvText = await fs.readFile(INPUT_PATH, "utf8");
  const rawRows = d3.csvParse(csvText);

  const rows = rawRows.map((d, index) => {
    const constituency =
      cleanString(d.constituency_x) || cleanString(d.constituency_y);

    return {
      rowId: index + 1,
      election: cleanString(d.election) || "2024-general-election",
      electionLabel: cleanString(d.election_label) || "2024 general election",
      electionDate: cleanString(d.election_date) || "2024-11-29",
      electionType: cleanString(d.election_type) || "general election",
      house: "Dáil Éireann",
      name: cleanString(d.candidate),
      gender: normaliseGender(d.gender),
      party: normaliseParty(d.party),
      count: toNumber(d.count),
      transfer: toNumber(d.transfer) ?? 0,
      votes: toNumber(d.total) ?? 0,
      status: normaliseStatus(d.condition),
      constituency,
      quota: toNumber(d.quota),
      seats: toNumber(d.seats),
    };
  });

  const cleanedRows = rows
    .filter((d) => d.name && d.constituency && Number.isFinite(d.count))
    .sort(sortRows);

  const output = {
    generatedAt: new Date().toISOString(),
    sourceFile: "election_results.csv",
    rowCount: cleanedRows.length,
    fields: [
      "rowId",
      "election",
      "electionLabel",
      "electionDate",
      "electionType",
      "house",
      "name",
      "gender",
      "party",
      "count",
      "transfer",
      "votes",
      "status",
      "constituency",
      "quota",
      "seats",
    ],
    data: cleanedRows,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8");

  console.log(`Normalised ${cleanedRows.length} rows`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
