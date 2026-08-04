export function LpFooter() {
  return (
    <footer className="bg-lp-ink px-5 py-10 text-center text-white/70 md:px-8">
      <p className="font-seasons text-lg tracking-[0.12em] text-lp-gold">BORGES & ZEMBRUSKI</p>
      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">Advocacia</p>
      <div className="mx-auto mt-6 max-w-xl space-y-2 text-sm leading-relaxed">
        <p>© {new Date().getFullYear()} Borges & Zembruski Advocacia. Todos os direitos reservados.</p>
        <p>Porto Alegre / RS · Atendimento em todo o Brasil</p>
        <p className="text-white/40">OAB/RS — Juliana Borges · Eliziane Zembruski</p>
      </div>
    </footer>
  );
}
