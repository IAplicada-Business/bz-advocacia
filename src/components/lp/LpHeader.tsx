import { Link } from "react-router-dom";
import logoBZ from "@/assets/logo-bz-new.png";

type LpHeaderProps = {
  onCtaClick: () => void;
};

export function LpHeader({ onCtaClick }: LpHeaderProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-lp-ink/70 to-transparent" />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Borges & Zembruski Advocacia">
          <img
            src={logoBZ}
            alt="B&Z"
            className="h-10 w-10 rounded-sm object-cover ring-1 ring-lp-gold/50 shadow-md md:h-11 md:w-11"
          />
          <div className="leading-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
            <p className="font-seasons text-sm tracking-[0.18em] md:text-base">BORGES & ZEMBRUSKI</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-lp-gold md:text-[11px]">
              Advocacia
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/auth"
            className="text-[11px] uppercase tracking-[0.22em] text-white/70 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] transition-colors hover:text-lp-gold md:text-xs"
          >
            Acesso
          </Link>
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-sm bg-lp-gold px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-lp-ink shadow-md transition hover:bg-lp-gold-soft md:px-5 md:text-xs"
          >
            Analisar meu caso
          </button>
        </div>
      </div>
    </header>
  );
}
