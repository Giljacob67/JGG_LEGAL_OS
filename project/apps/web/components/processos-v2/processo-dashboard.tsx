"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, AlertTriangle, Calendar, TrendingUp } from "lucide-react";

interface ProcessoDashboardProps {
  processoId: string;
}

interface DashboardData {
  andamentos: {
    total: number;
    porMes: { mes: string; count: number }[];
    criticos: number;
  };
  prazos: {
    total: number;
    abertos: number;
    cumpridos: number;
    perdidos: number;
  };
  documentos: {
    total: number;
    porTipo: { tipo: string; count: number }[];
  };
  tempo: {
    diasDesdeDistribuicao: number | null;
    diasDesdeUltimoAndamento: number | null;
  };
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function ProcessoDashboard({ processoId }: ProcessoDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [processoId]);

  async function loadDashboard() {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Não foi possível carregar o dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Métricas do Processo
      </h3>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.andamentos.total}</p>
                <p className="text-xs text-muted-foreground">Andamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.prazos.abertos}</p>
                <p className="text-xs text-muted-foreground">Prazos Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.andamentos.criticos}</p>
                <p className="text-xs text-muted-foreground">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.tempo.diasDesdeDistribuicao ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">Dias Ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Andamentos por Mês */}
        {data.andamentos.porMes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Andamentos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.andamentos.porMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Documentos por Tipo */}
        {data.documentos.porTipo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Documentos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.documentos.porTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.tipo || ''} (${((entry.percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.documentos.porTipo.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status de Prazos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status de Prazos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cumpridos</span>
                <span className="text-sm text-muted-foreground">
                  {data.prazos.cumpridos}/{data.prazos.total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${
                      data.prazos.total > 0
                        ? (data.prazos.cumpridos / data.prazos.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Perdidos</span>
                <span className="text-sm text-muted-foreground">
                  {data.prazos.perdidos}/{data.prazos.total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{
                    width: `${
                      data.prazos.total > 0
                        ? (data.prazos.perdidos / data.prazos.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
