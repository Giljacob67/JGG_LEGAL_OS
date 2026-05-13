import { CourtConnector, ConnectorSearchResult } from "./types";
import { normalizeDatajudPayload } from "./normalizers";

const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// Aliases baseados no manual de integração do Datajud
const TRIBUNAIS_FALLBACK = [
  "api_publica_tjpr", "api_publica_tjmt", "api_publica_tjsc", "api_publica_tjrs", 
  "api_publica_tjgo", "api_publica_tjmg", "api_publica_tjsp", "api_publica_tjrj",
  "api_publica_trf1", "api_publica_trf2", "api_publica_trf3", "api_publica_trf4", "api_publica_trf5", "api_publica_trf6",
  "api_publica_stj"
];

// Dicionário para inferir o tribunal a partir dos segmentos do CNJ (justiça + tribunal)
// O CNJ segue o formato NNNNNNN-DD.AAAA.J.TR.OOOO
// J (1 dígito) - Ramo da justiça (ex: 8 = Justiça Estadual, 4 = Justiça Federal)
// TR (2 dígitos) - Tribunal respectivo (ex: no TRF (4) 04 = 4a Região. Na Estadual (8) 16 = PR)
const CNJ_TRIBUNAL_MAP: Record<string, string> = {
  "8.16": "api_publica_tjpr",
  "8.11": "api_publica_tjmt",
  "8.24": "api_publica_tjsc",
  "8.21": "api_publica_tjrs",
  "8.09": "api_publica_tjgo",
  "8.13": "api_publica_tjmg",
  "8.26": "api_publica_tjsp",
  "8.19": "api_publica_tjrj",
  "4.01": "api_publica_trf1",
  "4.02": "api_publica_trf2",
  "4.03": "api_publica_trf3",
  "4.04": "api_publica_trf4",
  "4.05": "api_publica_trf5",
  "4.06": "api_publica_trf6",
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
