export function constituencySlug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function contestSort(a, b) {
  const aGeneral = a.electionType === "general election" ? 1 : 0;
  const bGeneral = b.electionType === "general election" ? 1 : 0;
  return (
    bGeneral - aGeneral ||
    String(b.electionDate ?? "").localeCompare(String(a.electionDate ?? ""))
  );
}

export function resolveElectionUrlState({ rows = [], search = "", defaults = {} } = {}) {
  const params = new URLSearchParams(search);
  const constituencies = Array.from(
    new Map(
      rows
        .map((row) => row.constituency)
        .filter(Boolean)
        .map((name) => [constituencySlug(name), name])
    )
  );
  const constituencyBySlug = new Map(constituencies);
  const requestedConstituency = constituencyBySlug.get(
    constituencySlug(params.get("constituency"))
  );
  const defaultConstituency = constituencyBySlug.get(
    constituencySlug(defaults.constituency)
  );
  const constituency =
    requestedConstituency ??
    defaultConstituency ??
    constituencies
      .map(([, name]) => name)
      .sort((a, b) => a.localeCompare(b, "en"))[0] ??
    defaults.constituency ??
    null;

  const contests = Array.from(
    new Map(
      rows
        .filter((row) => row.constituency === constituency && row.election)
        .map((row) => [
          row.election,
          {
            id: row.election,
            electionDate: row.electionDate,
            electionType: row.electionType,
          },
        ])
    ).values()
  ).sort(contestSort);
  const contestIds = new Set(contests.map((contest) => contest.id));
  const requestedElection = params.get("election");
  const election =
    (contestIds.has(requestedElection) && requestedElection) ||
    (contestIds.has(defaults.election) && defaults.election) ||
    contests[0]?.id ||
    defaults.election ||
    null;

  return { constituency, election };
}

export function buildElectionUrl(state, href) {
  const url = new URL(href);
  const constituency = constituencySlug(state?.constituency);

  if (constituency) url.searchParams.set("constituency", constituency);
  else url.searchParams.delete("constituency");

  if (state?.election) url.searchParams.set("election", state.election);
  else url.searchParams.delete("election");

  return url;
}

export function updateElectionUrl(
  state,
  {
    mode = "replace",
    href = window.location.href,
    history = window.history,
  } = {}
) {
  const url = buildElectionUrl(state, href);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return;

  const method = mode === "push" ? "pushState" : "replaceState";
  history[method](null, "", next);
}
