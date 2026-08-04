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
      {/* Mesmo eixo horizontal do hero (max-w 1400 + paddings) para alinhar logo ao texto esquerdo */}
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5 md:px-10 md:py-3.5 lg:px-14">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="Borges & Zembruski Advocacia">
          <img
            src={logoBZ}
            alt="B&Z"
            className="h-8 w-8 shrink-0 rounded-sm object-cover ring-1 ring-lp-gold/50 sm:h-9 sm:w-9 md:h-10 md:w-10"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-seasons text-[12px] tracking-[0.12em] text-lp-ink sm:text-sm sm:tracking-[0.16em] md:text-[15px]">
              BORGES & ZEMBRUSKI
            </p>
            <p className="text-[9px] uppercase tracking-[0.22em] text-lp-gold sm:text-[10px] sm:tracking-[0.26em] md:text-[11px]">
              Advocacia
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-5">
          <Link
            to="/auth"
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-lp-ink/55 transition-colors hover:text-lp-gold sm:text-[11px] sm:tracking-[0.2em] md:text-xs"
          >
            Acesso
          </Link>
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-full bg-lp-ink px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-lp-ink/90 sm:px-4 sm:py-2.5 sm:text-[11px] sm:tracking-[0.14em] md:px-5 md:text-xs"
          >
            <span className="sm:hidden">Analisar</span>
            <span className="hidden sm:inline">Analisar meu caso</span>
          </button>
        </div>
      </div>
    </header>
  );
}
