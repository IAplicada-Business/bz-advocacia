import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSdrAlerts } from "@/hooks/useSdrAlerts";

/**
 * Preferências de som e notificação do SDR (localStorage).
 * O disparo continua na página de Leads via useSdrAlerts(leads).
 */
export function AlertasSdrControle() {
  const {
    soundEnabled,
    setSoundEnabled,
    notifPermission,
    notifEnabled,
    requestNotifications,
    setNotifEnabled,
  } = useSdrAlerts(undefined);

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-seasons text-xl text-primary">Alertas do funil SDR</CardTitle>
          <CardDescription>
            Som e notificações do navegador quando um lead fica aguardando atendimento.
            Só funcionam com a aba do CRM aberta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Som</p>
              <p className="text-xs text-muted-foreground">
                Toca um aviso ao chegar lead quente (bot qualificou).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="ml-1.5 text-xs">
                {soundEnabled ? "Som ativo" : "Som desativado"}
              </span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Notificações do navegador</p>
              <p className="text-xs text-muted-foreground">
                Popup do sistema com nome do lead. O navegador precisa permitir este site.
              </p>
            </div>
            {notifPermission === "denied" ? (
              <Button variant="outline" size="sm" disabled title="Libere nas configurações do navegador">
                <BellOff className="h-4 w-4" />
                <span className="ml-1.5 text-xs">Bloqueadas no navegador</span>
              </Button>
            ) : notifEnabled && notifPermission === "granted" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotifEnabled(false)}
                title="Desativar notificações neste navegador"
              >
                <Bell className="h-4 w-4 text-green-600" />
                <span className="ml-1.5 text-xs">Notificações ativas</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void requestNotifications()}>
                <Bell className="h-4 w-4" />
                <span className="ml-1.5 text-xs">Ativar notificações</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
