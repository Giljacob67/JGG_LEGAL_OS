/**
 * PJe Connector — Processo Judicial Eletrônico (Sistema CNJ)
 *
 * O PJe é o sistema oficial do CNJ, adotado por:
 * - Todos os TRFs (Federal)
 * - Maioria dos TRTs (Trabalhista)
 * - Vários TJs estaduais (TJAL, TJBA, TJCE, TJDFT, TJGO, TJMA, TJMG, TJPA, TJPB, TJPE, TJPI...)
 *
 * Cada tribunal tem sua própria instância PJe:
 * - pje.trf1.jus.br / pje2.trf1.jus.br
 * - pje.tst.jus.br
 * - pje.tjxx.jus.br
 *
 * Autenticação: CPF + senha do advogado cadastrado na OAB
 * As credenciais são armazenadas criptografadas em CourtConnectorCredential
 *   { tipoAuth: "basic_auth", payload: { username: CPF, password: senha } }
 */

import { CourtConnector, ConnectorSearchResult } from "./types";
import { logger } from "../logger";

// Mapa tribunal → URL base PJe
// Formato: alias_datajud → URL base
const PJE_URLS: Record<string, string> = {
  // Federais
  trf1: "https://pje.trf1.jus.br/pje",
  trf2: "https://pje.trf2.jus.br/pje",
  trf3: "https://pje.trf3.jus.br/pje",
  trf4: "https://pje.trf4.jus.br/pje",
  trf5: "https://pje.trf5.jus.br/pje",
  trf6: "https://pje.trf6.jus.br/pje",
  // Trabalhistas
  tst: "https://pje.tst.jus.br/pje",
  trt1: "https://pje.trt1.jus.br/pje",
  trt2: "https://pje.trt2.jus.br/pje",
  trt3: "https://pje.trt3.jus.br/pje",
  trt4: "https://pje.trt4.jus.br/pje",
  trt5: "https://pje.trt5.jus.br/pje",
  trt6: "https://pje.trt6.jus.br/pje",
  trt7: "https://pje.trt7.jus.br/pje",
  trt8: "https://pje.trt8.jus.br/pje",
  trt9: "https://pje.trt9.jus.br/pje",
  trt10: "https://pje.trt10.jus.br/pje",
  trt11: "https://pje.trt11.jus.br/pje",
  trt12: "https://pje.trt12.jus.br/pje",
  trt13: "https://pje.trt13.jus.br/pje",
  trt14: "https://pje.trt14.jus.br/pje",
  trt15: "https://pje.trt15.jus.br/pje",
  trt16: "https://pje.trt16.jus.br/pje",
  trt17: "https://pje.trt17.jus.br/pje",
  trt18: "https://pje.trt18.jus.br/pje",
  trt19: "https://pje.trt19.jus.br/pje",
  trt20: "https://pje.trt20.jus.br/pje",
  trt21: "https://pje.trt21.jus.br/pje",
  trt22: "https://pje.trt22.jus.br/pje",
  trt23: "https://pje.trt23.jus.br/pje",
  trt24: "https://pje.trt24.jus.br/pje",
  // Estaduais com PJe
  tjal: "https://pje.tjal.jus.br/pje",
  tjba: "https://pje.tjba.jus.br/pje",
  tjce: "https://pje.tjce.jus.br/pje",
  tjdft: "https://pje.tjdft.jus.br/pje",
  tjgo: "https://pje.tjgo.jus.br/pje",
  tjma: "https://pje.tjma.jus.br/pje",
  tjmg: "https://pje.tjmg.jus.br/pje",
  tjpa: "https://pje.tjpa.jus.br/pje",
  tjpb: "https://pje.tjpb.jus.br/pje",
  tjpe: "https://pje.tjpe.jus.br/pje",
  tjpi: "https://pje.tjpi.jus.br/pje",
  tjrn: "https://pje.tjrn.jus.br/pje",
  tjse: "https://pje.tjse.jus.br/pje",
  tjto: "https://pje.tjto.jus.br/pje",
};

interface PjeCredential {
  username: string; // CPF do advogado
  password: string;
}

export class PjeConnector implements CourtConnector {
  id: string;
  name: string;
  kind = "authenticated" as const;
  supports = {
    cnjSearch: true,
    batchSearch: false,
    partySearch: false,
    movements: true,
    documents: false, // requer download autenticado — fase futura
    webhooks: false,
  };

  private baseUrl: string;
  private credential: PjeCredential;

  constructor(tribunal: string, credential: PjeCredential) {
    const normalizedTribunal = tribunal.replace("api_publica_", "").toLowerCase();
    const url = PJE_URLS[normalizedTribunal];
    if (!url) {
      throw new Error(`Tribunal '${tribunal}' não tem URL PJe configurada`);
    }
    this.id = `pje_${normalizedTribunal}`;
    this.name = `PJe ${normalizedTribunal.toUpperCase()}`;
    this.baseUrl = url;
    this.credential = credential;
  }

  // Obtém token JWT via login
  private async authenticate(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: this.credential.username,
        senha: this.credential.password,
      }),
      // 10s timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`PJe auth falhou: HTTP ${res.status}`);
    }

    const data = await res.json();
    // O campo varia por instância: token, access_token, jwtToken
    const token = data.token ?? data.access_token ?? data.jwtToken;
    if (!token) {
      throw new Error("PJe auth: token não encontrado na resposta");
    }
    return token as string;
  }

  async searchByCNJ({ cnj }: { cnj: string; tribunal?: string }): Promise<ConnectorSearchResult> {
    const cleanCnj = cnj.replace(/\D/g, "");

    try {
      const token = await this.authenticate();

      // Endpoint de busca por número — pode variar por instância
      const res = await fetch(
        `${this.baseUrl}/api/processos?numeroProcesso=${cleanCnj}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!res.ok) {
        return {
          success: false,
          cnj: cleanCnj,
          fonte: this.id,
          erro: `PJe HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      // Estrutura pode variar — tentamos os campos mais comuns
      const processo = data?.content?.[0] ?? data?.processos?.[0] ?? data;

      if (!processo || !processo.id) {
        return {
          success: false,
          cnj: cleanCnj,
          fonte: this.id,
          erro: "Processo não encontrado no PJe",
        };
      }

      // Normalizar movimentos (estrutura PJe varia por tribunal)
      const movimentos = (processo.movimentos ?? processo.andamentos ?? []).map((m: Record<string, unknown>) => ({
        data: String(m.dataMovimento ?? m.data ?? m.dataHora ?? ""),
        evento: String(m.descricaoMovimento ?? m.evento ?? m.nome ?? ""),
        descricao: String(m.complemento ?? m.descricao ?? m.observacao ?? ""),
      }));

      return {
        success: true,
        cnj: cleanCnj,
        fonte: this.id,
        tribunalEncontrado: this.id.replace("pje_", ""),
        scoreConfianca: 1.0,
        processoNormalizado: {
          cnj: cleanCnj,
          fonte: this.id,
          classe: String(processo.classeProcessual?.descricao ?? processo.classe ?? ""),
          assunto: String(processo.assuntos?.[0]?.descricao ?? processo.assunto ?? ""),
          orgaoJulgador: String(processo.orgaoJulgador?.descricao ?? processo.orgaoJulgador ?? ""),
          situacao: String(processo.situacao?.descricao ?? processo.situacao ?? ""),
          distribuicao: String(processo.dataDistribuicao ?? processo.distribuicao ?? ""),
          movimentos,
        },
        payloadBruto: processo,
      };
    } catch (err) {
      logger.error(`[PjeConnector] Erro ao buscar ${cleanCnj}`, err);
      return {
        success: false,
        cnj: cleanCnj,
        fonte: this.id,
        erro: err instanceof Error ? err.message : "Erro de conexão ao PJe",
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  // Utilitário: cria instância a partir de credencial descriptografada
  static fromDecryptedCredential(tribunal: string, decrypted: { username: string; password: string }): PjeConnector {
    return new PjeConnector(tribunal, decrypted);
  }
}
