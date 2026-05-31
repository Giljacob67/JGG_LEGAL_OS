import { CourtConnector, ConnectorSearchResult } from "./types";
import { normalizeDatajudPayload } from "./normalizers";

const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// Cobertura completa DataJud — todos os tribunais disponíveis na API pública
// Ordem: priorizados (mais usados) primeiro para consulta por fallback
const TRIBUNAIS_FALLBACK = [
  // Estaduais grandes
  "api_publica_tjsp", "api_publica_tjrj", "api_publica_tjmg", "api_publica_tjrs",
  "api_publica_tjpr", "api_publica_tjsc", "api_publica_tjba", "api_publica_tjgo",
  "api_publica_tjmt", "api_publica_tjms", "api_publica_tjce", "api_publica_tjpe",
  "api_publica_tjma", "api_publica_tjpa", "api_publica_tjrn", "api_publica_tjpb",
  "api_publica_tjal", "api_publica_tjse", "api_publica_tjpi", "api_publica_tjam",
  "api_publica_tjac", "api_publica_tjap", "api_publica_tjro", "api_publica_tjrr",
  "api_publica_tjto", "api_publica_tjdft",
  // Federais
  "api_publica_trf1", "api_publica_trf2", "api_publica_trf3",
  "api_publica_trf4", "api_publica_trf5", "api_publica_trf6",
  // Trabalhistas
  "api_publica_tst",
  "api_publica_trt1", "api_publica_trt2", "api_publica_trt3", "api_publica_trt4",
  "api_publica_trt5", "api_publica_trt6", "api_publica_trt7", "api_publica_trt8",
  "api_publica_trt9", "api_publica_trt10", "api_publica_trt11", "api_publica_trt12",
  "api_publica_trt13", "api_publica_trt14", "api_publica_trt15", "api_publica_trt16",
  "api_publica_trt17", "api_publica_trt18", "api_publica_trt19", "api_publica_trt20",
  "api_publica_trt21", "api_publica_trt22", "api_publica_trt23", "api_publica_trt24",
  // Superiores
  "api_publica_stj", "api_publica_stf", "api_publica_tse", "api_publica_stm",
];

// CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO — J=ramo, TT=tribunal
// Inferência direta evita busca por fallback (muito mais rápida)
const CNJ_TRIBUNAL_MAP: Record<string, string> = {
  // ─── Justiça Estadual (J=8) ───────────────────────────────────
  "8.01": "api_publica_tjac",   // Acre
  "8.02": "api_publica_tjal",   // Alagoas
  "8.03": "api_publica_tjam",   // Amazonas
  "8.04": "api_publica_tjap",   // Amapá
  "8.05": "api_publica_tjba",   // Bahia
  "8.06": "api_publica_tjce",   // Ceará
  "8.07": "api_publica_tjdft",  // Distrito Federal e Territórios
  "8.08": "api_publica_tjdft",  // DF (variante de segmento)
  "8.09": "api_publica_tjgo",   // Goiás
  "8.10": "api_publica_tjma",   // Maranhão
  "8.11": "api_publica_tjmt",   // Mato Grosso
  "8.12": "api_publica_tjms",   // Mato Grosso do Sul
  "8.13": "api_publica_tjmg",   // Minas Gerais
  "8.14": "api_publica_tjpa",   // Pará
  "8.15": "api_publica_tjpb",   // Paraíba
  "8.16": "api_publica_tjpr",   // Paraná
  "8.17": "api_publica_tjpe",   // Pernambuco
  "8.18": "api_publica_tjpi",   // Piauí
  "8.19": "api_publica_tjrj",   // Rio de Janeiro
  "8.20": "api_publica_tjrn",   // Rio Grande do Norte
  "8.21": "api_publica_tjrs",   // Rio Grande do Sul
  "8.22": "api_publica_tjro",   // Rondônia
  "8.23": "api_publica_tjrr",   // Roraima
  "8.24": "api_publica_tjsc",   // Santa Catarina
  "8.25": "api_publica_tjse",   // Sergipe
  "8.26": "api_publica_tjsp",   // São Paulo
  "8.27": "api_publica_tjto",   // Tocantins
  // ─── Justiça Federal (J=4) ───────────────────────────────────
  "4.01": "api_publica_trf1",
  "4.02": "api_publica_trf2",
  "4.03": "api_publica_trf3",
  "4.04": "api_publica_trf4",
  "4.05": "api_publica_trf5",
  "4.06": "api_publica_trf6",
  // ─── Justiça do Trabalho (J=5) ───────────────────────────────
  "5.00": "api_publica_tst",
  "5.01": "api_publica_trt1",   // RJ
  "5.02": "api_publica_trt2",   // SP
  "5.03": "api_publica_trt3",   // MG
  "5.04": "api_publica_trt4",   // RS
  "5.05": "api_publica_trt5",   // BA
  "5.06": "api_publica_trt6",   // PE
  "5.07": "api_publica_trt7",   // CE
  "5.08": "api_publica_trt8",   // PA/AP
  "5.09": "api_publica_trt9",   // PR
  "5.10": "api_publica_trt10",  // DF/TO
  "5.11": "api_publica_trt11",  // AM/RR
  "5.12": "api_publica_trt12",  // SC
  "5.13": "api_publica_trt13",  // PB
  "5.14": "api_publica_trt14",  // RO/AC
  "5.15": "api_publica_trt15",  // Campinas/SP interior
  "5.16": "api_publica_trt16",  // MA
  "5.17": "api_publica_trt17",  // ES
  "5.18": "api_publica_trt18",  // GO
  "5.19": "api_publica_trt19",  // AL
  "5.20": "api_publica_trt20",  // SE
  "5.21": "api_publica_trt21",  // RN
  "5.22": "api_publica_trt22",  // PI
  "5.23": "api_publica_trt23",  // MT
  "5.24": "api_publica_trt24",  // MS
  // ─── Justiça Eleitoral (J=6) ─────────────────────────────────
  "6.00": "api_publica_tse",
  // ─── Justiça Militar (J=7) ───────────────────────────────────
  "7.00": "api_publica_stm",
  // ─── Superiores (J=1, J=3) ───────────────────────────────────
  "1.00": "api_publica_stf",
  "3.00": "api_publica_stj",
};

export class DatajudConnector implements CourtConnector {
  id = "datajud_public";
  name = "DataJud (Pública)";
  kind = "public" as const;
  supports = {
    cnjSearch: true,
    batchSearch: false,
    partySearch: false,
    movements: false, // Pode vir na busca, mas na pública é restrito
    documents: false,
    webhooks: false,
  };

  private getApiKey(): string {
    const apiKey = process.env.DATAJUD_API_KEY;
    if (!apiKey) {
      throw new Error("DATAJUD_API_KEY não configurada");
    }
    return apiKey;
  }

  private inferTribunal(cnj: string): string | null {
    const digits = cnj.replace(/\D/g, "");
    if (digits.length !== 20) return null;
    
    const justica = digits.slice(13, 14);
    const tribunal = digits.slice(14, 16);
    const key = `${justica}.${tribunal}`;
    
    return CNJ_TRIBUNAL_MAP[key] || null;
  }

  private normalizeAlias(tribunal: string): string {
    const t = tribunal.toLowerCase();
    if (!t.startsWith("api_publica_")) {
      return `api_publica_${t}`;
    }
    return t;
  }

  async searchByCNJ({ cnj, tribunal }: { cnj: string; tribunal?: string }): Promise<ConnectorSearchResult> {
    const apiKey = this.getApiKey();
    const cleanCnj = cnj.replace(/\D/g, "");
    
    let tribunaisParaTentar: string[] = [];
    
    if (tribunal) {
      tribunaisParaTentar.push(this.normalizeAlias(tribunal));
    } else {
      const inferred = this.inferTribunal(cnj);
      if (inferred) {
        tribunaisParaTentar.push(inferred);
      } else {
        tribunaisParaTentar = [...TRIBUNAIS_FALLBACK];
      }
    }

    const abortController = new AbortController();
    // 15 seconds global timeout
    const timeoutId = setTimeout(() => abortController.abort(), 15000);

    try {
      for (const tj of tribunaisParaTentar) {
        try {
          const res = await fetch(`${DATAJUD_BASE_URL}/${tj}/_search`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `ApiKey ${apiKey}`,
            },
            body: JSON.stringify({
              query: {
                match: {
                  "numeroProcesso.keyword": cleanCnj,
                },
              },
              size: 1,
            }),
            signal: abortController.signal,
            next: { revalidate: 0 },
          });

          if (!res.ok) continue;

          const data = await res.json();
          const hits = data?.hits?.hits;
          
          if (hits && hits.length > 0) {
            const source = hits[0]._source;
            const tribunalEncontrado = tj.replace("api_publica_", "");
            return {
              success: true,
              cnj: cleanCnj,
              fonte: this.id,
              tribunalEncontrado,
              scoreConfianca: 1.0,
              processoNormalizado: normalizeDatajudPayload(cleanCnj, source, tribunalEncontrado),
              payloadBruto: source,
            };
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
             break;
          }
          // Falha em um tribunal específico não interrompe a busca
          continue;
        }
      }
      
      return {
        success: false,
        cnj: cleanCnj,
        fonte: this.id,
        erro: "Processo não encontrado em nenhum tribunal consultado",
      };
      
    } catch (error: unknown) {
      return {
        success: false,
        cnj: cleanCnj,
        fonte: this.id,
        erro: error instanceof Error ? error.message : "Erro de conexão ao DataJud",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
