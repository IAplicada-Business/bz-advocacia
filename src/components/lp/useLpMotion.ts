import { useEffect } from "react";

/** Scroll reveals + header solidify — leve, sem GSAP (ref: ritmo 21hrs). */
export function useLpMotion(rootSelector = ".lp-theme") {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const header = root.querySelector<HTMLElement>("[data-lp-header]");
    const onScroll = () => {
      if (!header) return;
      header.dataset.solid = window.scrollY > 24 ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const reveal = (el: Element) => el.classList.add("is-visible");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        // Já na primeira dobra — revela sem esperar o observer
        requestAnimationFrame(() => reveal(el));
      } else {
        io.observe(el);
      }
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [rootSelector]);
}
