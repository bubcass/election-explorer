const sections = [
  { id: "dail", label: "Dáil", hrefKey: "dail" },
  { id: "seanad", label: "Seanad", hrefKey: "seanad" }
];

export function renderElectionSectionNav({
  currentSection = "dail",
  hrefs = {dail: "./", seanad: "./seanad/"}
} = {}) {
  const shell = document.createElement("div");
  shell.className = "section-nav-shell";

  const nav = document.createElement("nav");
  nav.className = "section-nav";
  nav.setAttribute("aria-label", "Election Explorer sections");

  const currentLabel = sections.find((section) => section.id === currentSection)?.label || "Explore";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "section-nav__toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = `<span>${currentLabel}</span><i aria-hidden="true"></i>`;

  const list = document.createElement("div");
  list.className = "section-nav__list section-nav__list--two-up";

  for (const section of sections) {
    const link = document.createElement("a");
    link.className = "section-nav__link";
    link.href = hrefs[section.hrefKey] ?? "./";
    link.textContent = section.label;
    if (section.id === currentSection) link.setAttribute("aria-current", "page");
    link.addEventListener("click", () => setOpen(false));
    list.appendChild(link);
  }

  nav.append(toggle, list);
  shell.appendChild(nav);

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

  if (typeof window !== "undefined") {
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    let pending = false;

    const syncDocking = () => {
      pending = false;
      const masthead = document.querySelector(".oireachtas-masthead");
      const mastheadInner = masthead?.querySelector(".oireachtas-masthead__inner");
      const mobileTools = document.querySelector(".mobile-reading-tools");
      if (!masthead || !mastheadInner || !mobileTools) return;

      const navHeight = nav.offsetHeight || 46;
      const dockingLine = mobileQuery.matches ? 12 : masthead.offsetHeight;
      const shouldDock = shell.getBoundingClientRect().top <= dockingLine;

      shell.style.height = shouldDock ? `${navHeight}px` : "";
      nav.classList.toggle("section-nav--docked", shouldDock);
      masthead.classList.toggle("oireachtas-masthead--docked", shouldDock && !mobileQuery.matches);

      if (shouldDock && mobileQuery.matches) {
        if (nav.parentElement !== mobileTools) mobileTools.insertBefore(nav, mobileTools.lastElementChild);
        mobileTools.hidden = false;
      } else if (shouldDock) {
        if (nav.parentElement !== mastheadInner) mastheadInner.insertBefore(nav, mastheadInner.querySelector(".oireachtas-masthead__actions"));
        mobileTools.hidden = true;
      } else {
        if (nav.parentElement !== shell) shell.appendChild(nav);
        mobileTools.hidden = true;
        setOpen(false);
      }
    };

    const scheduleSync = () => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(syncDocking);
    };

    window.addEventListener("scroll", scheduleSync, {passive: true});
    window.addEventListener("resize", scheduleSync, {passive: true});
    mobileQuery.addEventListener("change", scheduleSync);
    document.addEventListener("pointerdown", (event) => {
      if (nav.classList.contains("is-open") && !nav.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.requestAnimationFrame(syncDocking);
  }

  return shell;
}
