export function electionTimelineControls({
  state = {
    count: null,
  },
  resultsPromise = Promise.resolve([]),
  getConstituency = () => null,
  getElection = () => null,
  onChange = () => {},
} = {}) {
  const container = document.createElement("div");
  container.className = "pq-controls pq-controls--timeline";

  let rowsCache = [];

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getRowsForSelectedConstituency() {
    const constituency = getConstituency();
    const election = getElection();
    return rowsCache.filter(
      (d) => d.election === election && d.constituency === constituency,
    );
  }

  function getAvailableCounts() {
    return Array.from(
      new Set(
        getRowsForSelectedConstituency()
          .map((d) => d.count)
          .filter(Number.isFinite),
      ),
    ).sort((a, b) => a - b);
  }

  function ensureValidState() {
    const counts = getAvailableCounts();

    if (!counts.length) {
      state.count = null;
    } else if (!counts.includes(state.count)) {
      state.count = counts[counts.length - 1];
    }
  }

  function render() {
    ensureValidState();

    const counts = getAvailableCounts();
    const currentCount = state.count ?? "";
    const disabled = counts.length === 0;

    container.innerHTML = `
      <div class="control control--count-select">
        <label for="timeline-count-select" class="control-label">Select a count</label>
        <select
          id="timeline-count-select"
          name="count"
          class="control-input control-input--count-dropdown"
          ${disabled ? "disabled" : ""}
        >
          ${counts
            .map(
              (count) => `
                <option value="${count}" ${count === currentCount ? "selected" : ""}>
                  ${escapeHtml(`Count ${count}`)}
                </option>
              `,
            )
            .join("")}
        </select>
      </div>
    `;

    const countInput = container.querySelector("#timeline-count-select");

    countInput?.addEventListener("change", () => {
      state.count = Number(countInput.value);
      onChange(state);
    });
  }

  Promise.resolve(resultsPromise)
    .then((rows) => {
      rowsCache = Array.isArray(rows) ? rows : [];
      render();
    })
    .catch(() => {
      rowsCache = [];
      render();
    });

  window.addEventListener("elections:change", () => {
    render();
  });

  return container;
}
