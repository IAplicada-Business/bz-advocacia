import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Sparkles, Video, Zap } from "lucide-react";
import Atualizacoes from "./Atualizacoes";
import Automacoes from "./Automacoes";
import Treinamentos from "./Treinamentos";
import { AlertasSdrControle } from "@/components/configuracoes/AlertasSdrControle";

export default function Controle() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Controle</h1>
        <p className="text-muted-foreground mt-2">
          Alertas, atualizações do sistema, treinamentos e automações
        </p>
      </div>

      <Tabs defaultValue="alertas" className="w-full">
        <TabsList>
          <TabsTrigger value="alertas" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="treinamentos" className="gap-2">
            <Video className="h-4 w-4" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger value="atualizacoes" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Atualizações
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-2">
            <Zap className="h-4 w-4" />
            Automações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alertas">
          <AlertasSdrControle />
        </TabsContent>

        <TabsContent value="treinamentos">
          <Treinamentos />
        </TabsContent>

        <TabsContent value="atualizacoes">
          <Atualizacoes />
        </TabsContent>

        <TabsContent value="automacoes">
          <Automacoes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
