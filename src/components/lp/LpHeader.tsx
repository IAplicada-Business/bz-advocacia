import { Link } from "react-router-dom";
import logoBZ from "@/assets/logo-bz-new.png";

type LpHeaderProps = {
  onCtaClick: () => void;
};

export function LpHeader({ onCtaClick }: LpHeaderProps) {
  return (
    <header
      data-lp-header
      data-solid="false"
      className="lp-header fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8 md:py-3.5">
        <Link to="/" className="flex items-center gap-3" aria-label="Borges & Zembruski Advocacia">
          <img
            src={logoBZ}
            alt="B&Z"
            className="h-9 w-9 rounded-sm object-cover ring-1 ring-lp-gold/50 md:h-10 md:w-10"
          />
          <div className="leading-tight">
            <p className="font-seasons text-sm tracking-[0.16em] text-lp-ink md:text-[15px]">
              BORGES & ZEMBRUSKI
            </p>
            <p className="text-[10px] uppercase tracking-[0.26em] text-lp-gold md:text-[11px]">
              Advocacia
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/auth"
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-lp-ink/55 transition-colors hover:text-lp-gold md:text-xs"
          >
            Acesso
          </Link>
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-full bg-lp-ink px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-lp-ink/90 md:px-5 md:text-xs"
          >
            Analisar meu caso
          </button>
        </div>
      </div>
    </header>
  );
}
