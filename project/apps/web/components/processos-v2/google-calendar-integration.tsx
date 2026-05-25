"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoogleCalendarStatus {
  conectado: boolean;
  email?: string;
  ultimaSync?: string;
}

export function GoogleCalendarIntegration() {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/v1/integrations/google-calendar");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setLoading(false);
    }
  }

  async function conectar() {
    // TODO: Implementar OAuth2 flow com Google
    alert("Integração com Google Calendar será implementada em breve!");
  }

  async function sincronizar() {
    setSyncing(true);
    try {
      const res = await fetch("/api/v1/integrations/google-calendar/sync", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        await checkStatus();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao sincronizar");
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      alert("Erro ao sincronizar com Google Calendar");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.conectado ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Conectado</p>
                  <p className="text-sm text-gray-600">{status.email}</p>
                </div>
              </div>
              <Badge variant="default">Ativo</Badge>
            </div>

            {status.ultimaSync && (
              <div className="text-sm text-gray-600">
                Última sincronização:{" "}
                {formatDistanceToNow(new Date(status.ultimaSync), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </div>
            )}

            <Button
              onClick={sincronizar}
              disabled={syncing}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar Prazos"}
            </Button>

            <p className="text-xs text-gray-500">
              Sincroniza automaticamente todos os seus prazos abertos com o Google Calendar,
              criando eventos com lembretes configurados.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="font-medium">Não conectado</p>
            </div>

            <Button onClick={conectar} className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Conectar Google Calendar
            </Button>

            <p className="text-xs text-gray-500">
              Conecte sua conta do Google para sincronizar prazos automaticamente
              e receber notificações no calendário.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
