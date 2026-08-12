import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { Lead, ORIGEM_LABELS, TIPO_PROCESSO_OPTIONS } from "@/types/leads";
import { exportToExcel } from "@/lib/exportUtils";
import { format } from "date-fns";

const SEM_TIPO = "__sem_tipo__";

type Props = {
  open: boolean;
  onClose: () => void;
  clients: Lead[] | undefined;
};

function hasTipo(lead: Lead): boolean {
  return Boolean((lead.tipo_processo ?? "").trim());
}

export function ExportClientesDialog({ open, onClose, clients }: Props) {
  const tipoOptions = useMemo(() => {
    const fromData = new Set<string>();
    for (const c of clients || []) {
      const t = (c.tipo_processo ?? "").trim();
      if (t) fromData.add(t);
    }
    for (const t of TIPO_PROCESSO_OPTIONS) fromData.add(t);
    return [...fromData].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [clients]);

  const [selected, setSelected] = useState<string[]>([SEM_TIPO, ...TIPO_PROCESSO_OPTIONS]);
  const [exportAll, setExportAll] = useState(true);

  useEffect(() => {
    if (!open) return;
    setExportAll(true);
    setSelected([SEM_TIPO, ...tipoOptions]);
  }, [open, tipoOptions]);

  const toggle = (value: string) => {
    setExportAll(false);
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const selectAllTipos = () => {
    setExportAll(true);
    setSelected([SEM_TIPO, ...tipoOptions]);
  };

  const clearTipos = () => {
    setExportAll(false);
    setSelected([]);
  };

  const filtered = useMemo(() => {
    const list = clients || [];
    if (exportAll) return list;
    return list.filter((c) => {
      if (!hasTipo(c)) return selected.includes(SEM_TIPO);
      return selected.includes(c.tipo_processo.trim());
    });
  }, [clients, exportAll, selected]);

  const handleExport = () => {
    const rows = filtered.map((c) => ({
      Nome: c.nome_completo ?? "",
      WhatsApp: c.telefone ?? "",
      Email: c.email ?? "",
      CPF: c.cpf ?? "",
      Origem: ORIGEM_LABELS[c.origem as keyof typeof ORIGEM_LABELS] || c.origem || "",
      Tipo: (c.tipo_processo ?? "").trim() || "(sem tipo)",
      Situação: c.status_cliente ?? "",
      Estágio: c.estagio ?? "",
      "Data Cadastro": c.created_at
        ? format(new Date(c.created_at), "dd/MM/yyyy")
        : "",
      "Última Atualização": c.data_ultima_atividade
        ? format(new Date(c.data_ultima_atividade), "dd/MM/yyyy")
        : "",
      "Data Nascimento": c.data_nascimento
        ? format(new Date(c.data_nascimento + "T12:00:00"), "dd/MM/yyyy")
        : "",
      Endereço: c.endereco_completo ?? "",
    }));

    exportToExcel(rows, "clientes-bz");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar clientes (XLSX)</DialogTitle>
          <DialogDescription>
            Escolha o tipo de cliente para incluir na planilha. Use “Sem tipo” para quem está sem classificação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={selectAllTipos}>
              Todos
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearTipos}>
              Limpar
            </Button>
            <span className="ml-auto self-center text-xs text-muted-foreground">
              {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} na exportação
            </span>
          </div>

          <Separator />

          <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3 scrollbar-brand">
            <div className="flex items-center space-x-2 rounded-lg bg-primary/10 px-2 py-1.5">
              <Checkbox
                id="export-sem-tipo"
                checked={exportAll || selected.includes(SEM_TIPO)}
                onCheckedChange={() => toggle(SEM_TIPO)}
              />
              <Label htmlFor="export-sem-tipo" className="cursor-pointer font-medium">
                Sem tipo nenhum
              </Label>
            </div>

            {tipoOptions.map((tipo) => (
              <div key={tipo} className="flex items-center space-x-2 px-2">
                <Checkbox
                  id={`export-tipo-${tipo}`}
                  checked={exportAll || selected.includes(tipo)}
                  onCheckedChange={() => toggle(tipo)}
                />
                <Label htmlFor={`export-tipo-${tipo}`} className="cursor-pointer">
                  {tipo}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Exportar XLSX
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
