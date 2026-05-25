"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TipoRelatorio = "processo" | "produtividade" | "honorarios";

interface RelatorioData {
  tipo: TipoRelatorio;
  data: any;
}

export function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("processo");
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [filters, setFilters] = useState({
    processoId: "",
    dataInicio: "",
    dataFim: "",
    userId: "",
    clienteId: "",
  });

  async function gerarRelatorio() {
    setLoading(true);
    try {
      let url = "";
      switch (tipoRelatorio) {
        case "processo":
          url = `/api/v1/reports/processo/${filters.processoId}`;
          break;
        case "produtividade":
          url = `/api/v1/reports/produtividade?${new URLSearchParams(filters).toString()}`;
          break;
        case "honorarios":
          url = `/api/v1/reports/honorarios?${new URLSearchParams(filters).toString()}`;
          break;
      }

      const response = await fetch(url);
      const data = await response.json();
      setRelatorio({ tipo: tipoRelatorio, data });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportarCSV() {
    if (!relatorio) return;

    let csv = "";
    let filename = "";

    switch (relatorio.tipo) {
      case "processo":
        const p = relatorio.data.processo;
        csv = `Processo,${p.cnj}\n`;
        csv += `Cliente,${p.cliente.nome}\n`;
        csv += `Responsável,${p.responsavel.nome}\n`;
        csv += `Status,${p.status}\n`;
        csv += `Área,${p.area}\n`;
        csv += `Tribunal,${p.tribunal || ""}\n`;
        csv += `Vara,${p.vara || ""}\n`;
        csv += `Valor da Causa,${p.valorCausa || 0}\n`;
        csv += `Total Andamentos,${relatorio.data.stats.totalAndamentos}\n`;
        csv += `Andamentos Críticos,${relatorio.data.stats.andamentosCriticos}\n`;
        csv += `Total Documentos,${relatorio.data.stats.totalDocumentos}\n`;
        csv += `Total Prazos,${relatorio.data.stats.totalPrazos}\n`;
        csv += `Prazos Cumpridos,${relatorio.data.stats.prazosCumpridos}\n`;
        csv += `Prazos Pendentes,${relatorio.data.stats.prazosPendentes}\n`;
        csv += `Prazos Perdidos,${relatorio.data.stats.prazosPerdidos}\n`;
        filename = `relatorio-processo-${p.cnj}.csv`;
        break;

      case "produtividade":
        csv = "Responsável,Processos,Andamentos,Prazos,Cumpridos,Perdidos,Documentos\n";
        relatorio.data.porResponsavel.forEach((r: any) => {
          csv += `${r.responsavel.nome},${r.totalProcessos},${r.totalAndamentos},${r.totalPrazos},${r.prazosCumpridos},${r.prazosPerdidos},${r.totalDocumentos}\n`;
        });
        filename = `relatorio-produtividade.csv`;
        break;

      case "honorarios":
        csv = "Cliente,Processo,Tipo,Valor Fixo,Faturas,Pagas,Pendentes,Recebido,Pendente\n";
        relatorio.data.honorarios.forEach((h: any) => {
          const pagas = h.faturas.filter((f: any) => f.status === "paga").length;
          const pendentes = h.faturas.filter((f: any) => f.status === "pendente").length;
          const recebido = h.faturas
            .filter((f: any) => f.status === "paga")
            .reduce((sum: number, f: any) => sum + Number(f.valor), 0);
          const pendente = h.faturas
            .filter((f: any) => f.status === "pendente")
            .reduce((sum: number, f: any) => sum + Number(f.valor), 0);
          csv += `${h.cliente.nome},${h.processo?.cnj || "N/A"},${h.tipo},${h.valorFixo || 0},${h.faturas.length},${pagas},${pendentes},${recebido},${pendente}\n`;
        });
        filename = `relatorio-honorarios.csv`;
        break;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
      </div>

      {/* Seleção de Tipo */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            tipoRelatorio === "processo" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setTipoRelatorio("processo")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Processo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Relatório completo de um processo específico
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            tipoRelatorio === "produtividade" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setTipoRelatorio("produtividade")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Análise de produtividade por advogado
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            tipoRelatorio === "honorarios" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setTipoRelatorio("honorarios")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5" />
              Honorários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Relatório financeiro de honorários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tipoRelatorio === "processo" && (
            <div>
              <label className="block text-sm font-medium mb-2">ID do Processo</label>
              <input
                type="text"
                value={filters.processoId}
                onChange={(e) => setFilters({ ...filters, processoId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Cole o ID do processo"
              />
            </div>
          )}

          {(tipoRelatorio === "produtividade" || tipoRelatorio === "honorarios") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data Início</label>
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data Fim</label>
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={gerarRelatorio} disabled={loading}>
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            {relatorio && (
              <Button variant="outline" onClick={exportarCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {relatorio && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gerado em {format(new Date(relatorio.data.geradoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })} por {relatorio.data.geradoPor}
            </p>
          </CardHeader>
          <CardContent>
            {relatorio.tipo === "processo" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Dados do Processo</h3>
                    <dl className="space-y-1 text-sm">
                      <div><dt className="text-muted-foreground">CNJ:</dt><dd>{relatorio.data.processo.cnj}</dd></div>
                      <div><dt className="text-muted-foreground">Cliente:</dt><dd>{relatorio.data.processo.cliente.nome}</dd></div>
                      <div><dt className="text-muted-foreground">Responsável:</dt><dd>{relatorio.data.processo.responsavel.nome}</dd></div>
                      <div><dt className="text-muted-foreground">Status:</dt><dd>{relatorio.data.processo.status}</dd></div>
                      <div><dt className="text-muted-foreground">Área:</dt><dd>{relatorio.data.processo.area}</dd></div>
                      <div><dt className="text-muted-foreground">Valor da Causa:</dt><dd>R$ {relatorio.data.processo.valorCausa || 0}</dd></div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Estatísticas</h3>
                    <dl className="space-y-1 text-sm">
                      <div><dt className="text-muted-foreground">Total Andamentos:</dt><dd>{relatorio.data.stats.totalAndamentos}</dd></div>
                      <div><dt className="text-muted-foreground">Andamentos Críticos:</dt><dd>{relatorio.data.stats.andamentosCriticos}</dd></div>
                      <div><dt className="text-muted-foreground">Total Documentos:</dt><dd>{relatorio.data.stats.totalDocumentos}</dd></div>
                      <div><dt className="text-muted-foreground">Prazos Cumpridos:</dt><dd>{relatorio.data.stats.prazosCumpridos}</dd></div>
                      <div><dt className="text-muted-foreground">Prazos Pendentes:</dt><dd>{relatorio.data.stats.prazosPendentes}</dd></div>
                      <div><dt className="text-muted-foreground">Prazos Perdidos:</dt><dd>{relatorio.data.stats.prazosPerdidos}</dd></div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {relatorio.tipo === "produtividade" && (
              <div>
                <h3 className="font-semibold mb-4">Produtividade por Responsável</h3>
                <div className="space-y-3">
                  {relatorio.data.porResponsavel.map((r: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{r.responsavel.nome}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Processos:</span> {r.totalProcessos}</div>
                        <div><span className="text-muted-foreground">Andamentos:</span> {r.totalAndamentos}</div>
                        <div><span className="text-muted-foreground">Documentos:</span> {r.totalDocumentos}</div>
                        <div><span className="text-muted-foreground">Prazos:</span> {r.totalPrazos}</div>
                        <div><span className="text-muted-foreground">Cumpridos:</span> {r.prazosCumpridos}</div>
                        <div><span className="text-muted-foreground">Perdidos:</span> {r.prazosPerdidos}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatorio.tipo === "honorarios" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contratos</p>
                    <p className="text-2xl font-bold">{relatorio.data.totais.totalContratos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">R$ {relatorio.data.totais.valorTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recebido</p>
                    <p className="text-2xl font-bold text-green-600">R$ {relatorio.data.totais.valorRecebido.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-2xl font-bold text-orange-600">R$ {relatorio.data.totais.valorPendente.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {relatorio.data.honorarios.map((h: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{h.cliente.nome}</p>
                          <p className="text-muted-foreground">{h.processo?.cnj || "Sem processo"}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{h.tipo}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>Faturas: {h.faturas.length}</div>
                        <div>Pagas: {h.faturas.filter((f: any) => f.status === "paga").length}</div>
                        <div>Pendentes: {h.faturas.filter((f: any) => f.status === "pendente").length}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
