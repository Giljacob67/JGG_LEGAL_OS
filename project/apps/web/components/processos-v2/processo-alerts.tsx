"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcessoAlertsProps {
  processoId: string;
}

interface Alerta {
  id: string;
  tipo: "prazo_proximo" | "andamento_critico" | "mudanca_status" | "personalizado";
  ativo: boolean;
  configuracao: any;
  createdAt: string;
  ultimoDisparo?: string;
}

const TIPOS_ALERTA = [
  { value: "prazo_proximo", label: "Prazo Próximo", description: "Notificar quando um prazo estiver próximo do vencimento" },
  { value: "andamento_critico", label: "Andamento Crítico", description: "Notificar quando houver um andamento marcado como crítico" },
  { value: "mudanca_status", label: "Mudança de Status", description: "Notificar quando o status do processo mudar" },
  { value: "personalizado", label: "Personalizado", description: "Alerta personalizado com regras específicas" },
];

export function ProcessoAlerts({ processoId }: ProcessoAlertsProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novoAlerta, setNovoAlerta] = useState({
    tipo: "prazo_proximo" as Alerta["tipo"],
    ativo: true,
  });

  useEffect(() => {
    loadAlertas();
  }, [processoId]);

  async function loadAlertas() {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlertas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function criarAlerta() {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAlerta),
      });

      if (res.ok) {
        const alerta = await res.json();
        setAlertas((prev) => [...prev, alerta]);
        setShowForm(false);
        setNovoAlerta({ tipo: "prazo_proximo", ativo: true });
      }
    } catch (error) {
      console.error("Erro ao criar alerta:", error);
    }
  }

  async function toggleAlerta(alertaId: string, ativo: boolean) {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/alerts/${alertaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo }),
      });

      if (res.ok) {
        setAlertas((prev) =>
          prev.map((a) => (a.id === alertaId ? { ...a, ativo } : a))
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar alerta:", error);
    }
  }

  async function deletarAlerta(alertaId: string) {
    if (!confirm("Tem certeza que deseja excluir este alerta?")) return;

    try {
      const res = await fetch(`/api/v1/processes/${processoId}/alerts/${alertaId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
      }
    } catch (error) {
      console.error("Erro ao deletar alerta:", error);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas do Processo
            </CardTitle>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="text-sm font-semibold mb-3">Configurar Novo Alerta</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Alerta</label>
                  <select
                    value={novoAlerta.tipo}
                    onChange={(e) => setNovoAlerta({ ...novoAlerta, tipo: e.target.value as Alerta["tipo"] })}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    {TIPOS_ALERTA.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {TIPOS_ALERTA.find((t) => t.value === novoAlerta.tipo)?.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={criarAlerta} size="sm">
                    Criar Alerta
                  </Button>
                  <Button onClick={() => setShowForm(false)} variant="outline" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {alertas.length === 0 ? (
            <div className="text-center py-8">
              <BellOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum alerta configurado para este processo
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`h-5 w-5 ${alerta.ativo ? "text-blue-600" : "text-muted-foreground"}`} />
                    <div>
                      <div className="font-medium text-sm">
                        {TIPOS_ALERTA.find((t) => t.value === alerta.tipo)?.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado em {new Date(alerta.createdAt).toLocaleDateString("pt-BR")}
                        {alerta.ultimoDisparo && (
                          <> • Último disparo: {new Date(alerta.ultimoDisparo).toLocaleDateString("pt-BR")}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alerta.ativo ? "default" : "secondary"}>
                      {alerta.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      onClick={() => toggleAlerta(alerta.id, !alerta.ativo)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      {alerta.ativo ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => deletarAlerta(alerta.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
