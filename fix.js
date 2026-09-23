(() => {
  const ensureSection = (page) => {
    const section = document.querySelector(`.page[data-page="${page}"]`);
    return section || null;
  };

  const safeMoveDot = (p) => {
    const target = document.querySelector(`.tabs a[data-link="${p}"]`);
    const tabs = document.querySelector(".tabs");
    const dot = document.querySelector("#tab-dot");

    if (!target || !tabs || !dot) return;

    const navRect = tabs.getBoundingClientRect();
    const linkRect = target.getBoundingClientRect();

    document.querySelectorAll(".tabs a").forEach((link) => {
      link === target ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
    });

    dot.style.transform = `translateX(${linkRect.left - navRect.left + linkRect.width / 2 - 3}px)`;
  };

  const safeShow = (p, enter) => {
    if (!p) return;

    const nodes = document.querySelectorAll(".page");
    nodes.forEach((page) => {
      page.hidden = page.dataset.page !== p;
    });

    const section = ensureSection(p);
    if (!section) return;

    current = p;
    safeMoveDot(p);
    window.scrollTo(0, 0);

    if (enter) {
      const left = section.querySelector(".side.left");
      const right = section.querySelector(".side.right");

      if (left) left.classList.add("enter-l");
      if (right) right.classList.add("enter-r");

      setTimeout(() => {
        document.querySelectorAll(".enter-l,.enter-r").forEach((el) => {
          el.classList.remove("enter-l", "enter-r");
        });
      }, 800);
    }
  };

  const safeRoute = () => {
    if (!document.querySelector("#main")) return;

    const p = pages.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";

    if (p === current) return;

    if (current === null || isStill() || busy) {
      color = [...GLOW[p]];
      document.documentElement.style.setProperty("--lamp", GLOW[p].join(","));
      safeShow(p, false);
      if (isStill() && typeof frame === "function") frame(performance.now());
      return;
    }

    if (typeof travel === "function") travel(p);
  };

  if (typeof window.moveDot === "function") {
    window.moveDot = safeMoveDot;
  }

  if (typeof window.show === "function") {
    window.show = safeShow;
  }

  if (typeof window.route === "function") {
    window.route = safeRoute;
  }
})();
