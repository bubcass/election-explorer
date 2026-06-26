const sections = [
  { id: "dail", label: "Dáil", hrefKey: "dail" },
  { id: "seanad", label: "Seanad", hrefKey: "seanad" }
];

export function renderElectionSectionNav({
  currentSection = "dail",
  hrefs = {
    dail: "./",
    seanad: "./seanad/"
  }
} = {}) {
  const shell = document.createElement("div");
  shell.className = "section-nav-shell";

  const nav = document.createElement("div");
  nav.className = "section-nav";
  nav.setAttribute("role", "navigation");
  nav.setAttribute("aria-label", "Election Explorer sections");

  const list = document.createElement("div");
  list.className = "section-nav__list section-nav__list--two-up";

  for (const section of sections) {
    const link = document.createElement("a");
    link.className = "section-nav__link";
    link.href = hrefs[section.hrefKey] ?? "./";
    link.textContent = section.label;

    if (section.id === currentSection) {
      link.setAttribute("aria-current", "page");
    }

    list.appendChild(link);
  }

  nav.appendChild(list);
  shell.appendChild(nav);

  if (typeof window !== "undefined") {
    const syncFloating = () => {
      const shouldFloat = shell.getBoundingClientRect().top <= 0;
      shell.classList.toggle("section-nav-shell--floating", shouldFloat);

      if (shouldFloat) {
        shell.style.height = `${nav.offsetHeight}px`;
      } else {
        shell.style.height = "";
      }
    };

    const onScroll = () => window.requestAnimationFrame(syncFloating);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.requestAnimationFrame(syncFloating);
  }

  return shell;
}
