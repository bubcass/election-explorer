export default {
  title: "Election Explorer | Houses of the Oireachtas",
  head: `
    <link rel="preload" href="oireachtas-logo.svg" as="image" type="image/svg+xml">
    <link rel="icon" href="logo.png" type="image/png" sizes="32x32">
    <script>
      document.documentElement.lang = "en-IE";

      (() => {
        const storageKey = "election-explorer-theme";
        const colourScheme = window.matchMedia("(prefers-color-scheme: dark)");
        const readSavedTheme = () => {
          try {
            const value = localStorage.getItem(storageKey);
            return value === "dark" || value === "light" ? value : null;
          } catch {
            return null;
          }
        };
        const systemTheme = () => colourScheme.matches ? "dark" : "light";
        document.documentElement.dataset.theme = readSavedTheme() || systemTheme();
        colourScheme.addEventListener("change", () => {
          if (!readSavedTheme()) document.documentElement.dataset.theme = systemTheme();
        });
      })();

      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute("content", "width=device-width, initial-scale=1");
      } else {
        const meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1";
        document.head.appendChild(meta);
      }

      (() => {
        const setupOireachtasMasthead = () => {
          if (!document.body || document.querySelector(".oireachtas-masthead")) return;

          const masthead = document.createElement("header");
          masthead.className = "oireachtas-masthead";
          const inner = document.createElement("div");
          inner.className = "oireachtas-masthead__inner";

          const homeLink = document.createElement("a");
          homeLink.className = "oireachtas-masthead__home";
          homeLink.href = "https://www.oireachtas.ie/";
          homeLink.setAttribute("aria-label", "Return to oireachtas.ie");
          homeLink.title = "Return to oireachtas.ie";

          const logo = document.createElement("img");
          logo.className = "oireachtas-masthead__logo";
          logo.alt = "";
          logo.width = 163;
          logo.height = 69;
          logo.src = document.querySelector('link[rel="preload"][as="image"]')?.href || "oireachtas-logo.svg";
          homeLink.appendChild(logo);

          const resourceLink = document.createElement("a");
          resourceLink.className = "oireachtas-masthead__resource";
          resourceLink.href = "https://bubcass.github.io/open-data-insights/";
          resourceLink.textContent = "Open Data Insights";
          resourceLink.setAttribute("aria-label", "Open Data Insights home");

          const actions = document.createElement("div");
          actions.className = "oireachtas-masthead__actions";
          inner.append(homeLink, resourceLink, actions);
          masthead.appendChild(inner);

          const mobileTools = document.createElement("div");
          mobileTools.className = "mobile-reading-tools";
          mobileTools.hidden = true;
          mobileTools.innerHTML = \`
            <button class="mobile-reading-tools__back" type="button" aria-label="Go back" title="Go back">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg>
            </button>
            <div class="mobile-reading-tools__more-wrap">
              <button class="mobile-reading-tools__more" type="button" aria-label="More options" aria-expanded="false" title="More options">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
              </button>
              <div class="mobile-reading-tools__menu" hidden></div>
            </div>
          \`;

          const backButton = mobileTools.querySelector(".mobile-reading-tools__back");
          const moreButton = mobileTools.querySelector(".mobile-reading-tools__more");
          const moreMenu = mobileTools.querySelector(".mobile-reading-tools__menu");
          backButton.addEventListener("click", () => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = resourceLink.href;
          });
          const setMoreOpen = (open) => {
            moreMenu.hidden = !open;
            moreButton.setAttribute("aria-expanded", String(open));
          };
          moreButton.addEventListener("click", () => setMoreOpen(moreMenu.hidden));
          document.addEventListener("pointerdown", (event) => {
            if (!moreMenu.hidden && !mobileTools.contains(event.target)) setMoreOpen(false);
          });
          document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !moreMenu.hidden) {
              setMoreOpen(false);
              moreButton.focus();
            }
          });

          document.body.prepend(masthead);
          document.body.appendChild(mobileTools);
        };

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", setupOireachtasMasthead, {once: true});
        } else {
          setupOireachtasMasthead();
        }
      })();

      (() => {
        const setupBackToTop = () => {
          if (!document.body || document.querySelector(".page-back-to-top")) return;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "page-back-to-top";
          button.setAttribute("aria-label", "Back to top");
          button.title = "Back to top";
          button.hidden = true;
          button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6.5 14.5 5.5-5.5 5.5 5.5"/></svg>';
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
          button.addEventListener("click", () => window.scrollTo({top: 0, behavior: reducedMotion.matches ? "auto" : "smooth"}));
          let pending = false;
          const update = () => {
            pending = false;
            button.hidden = window.scrollY <= 640;
          };
          window.addEventListener("scroll", () => {
            if (pending) return;
            pending = true;
            window.requestAnimationFrame(update);
          }, {passive: true});
          document.body.appendChild(button);
          update();
        };
        if (document.readyState !== "complete") window.addEventListener("load", setupBackToTop, {once: true});
        else setupBackToTop();
      })();
    </script>
  `,
  root: "src",
  style: "style.css",
  theme: null,
  sidebar: false,
  toc: false,
  pager: false,
  footer: "© Houses of the Oireachtas",
};
