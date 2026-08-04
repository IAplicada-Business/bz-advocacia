import { useEffect } from "react";

/**
 * Motion entre dobras (ritmo 21hrs):
 * - header solidifica no scroll
 * - cada bloco [data-reveal] entra com fade/slide
 * - filhos com [data-stagger] entram em cascata
 * - parallax leve na foto do hero
 * - progresso + dobra ativa para preenchimento visual
 */
export function useLpMotion(rootSelector = ".lp-theme") {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const header = root.querySelector<HTMLElement>("[data-lp-header]");
    const heroImg = root.querySelector<HTMLElement>("[data-lp-hero-img]");
    const folds = Array.from(root.querySelectorAll<HTMLElement>("[data-fold]"));
    let raf = 0;

    const updateScrollMotion = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;

      if (header) header.dataset.solid = y > 24 ? "true" : "false";

      if (heroImg) {
        heroImg.style.transformOrigin = "70% 65%";
        heroImg.style.transform = "none";
      }

      let bestFold: HTMLElement | null = null;
      let bestScore = -1;

      folds.forEach((fold) => {
        const rect = fold.getBoundingClientRect();
        const mid = rect.top + rect.height * 0.42;
        const progress = 1 - Math.min(Math.max(mid / vh, 0), 1);
        fold.style.setProperty("--lp-fold-progress", progress.toFixed(3));

        // Score: how centered the fold is in the viewport
        const foldCenter = rect.top + rect.height / 2;
        const dist = Math.abs(foldCenter - vh * 0.48);
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        const score = visible > 0 ? visible - dist * 0.35 : -1;
        if (score > bestScore) {
          bestScore = score;
          bestFold = fold;
        }
      });

      folds.forEach((fold) => {
        fold.classList.toggle("is-active-fold", fold === bestFold);
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(updateScrollMotion);
    };

    updateScrollMotion();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const reveal = (el: Element) => {
      el.classList.add("is-visible");
      const kids = el.querySelectorAll<HTMLElement>(":scope [data-stagger]");
      kids.forEach((kid, i) => {
        kid.style.setProperty("--lp-stagger", String(i));
        kid.classList.add("is-visible");
      });
    };

    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" },
    );

    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.88 && rect.bottom > 40) {
        requestAnimationFrame(() => reveal(el));
      } else {
        io.observe(el);
      }
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [rootSelector]);
}
