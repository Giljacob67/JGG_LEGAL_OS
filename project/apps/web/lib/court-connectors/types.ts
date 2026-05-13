export interface NormalizedProcess {
  cnj: string;
  fonte: string;
  tribunal?: string;
  classe?: string;
  assunto?: string;
  tipo?: string;
  adverso?: string;
  distribuicao?: string;
  orgaoJulgador?: string;
  status?: string;
  valorCausa?: number;
  situacao?: string;
  movimentos?: NormalizedMovement[];
}

export interface NormalizedMovement {
  data: string;
  evento: string;
  descricao: string;
}

export interface ConnectorSearchResult {
  success: boolean;
  cnj: string;
  fonte: string;
  tribunalEncontrado?: string;
  scoreConfianca?: number;
  processoNormalizado?: NormalizedProcess;
  payloadBruto?: unknown;
  erro?: string;
}

export interface ConnectorMovement {
  data: string;
  evento: string;
  descricao: string;
}

export interface ConnectorDocument {
  id: string;
  nome: string;
  url?: string;
  data: string;
}

export interface CourtConnector {
  id: string;
  name: string;
  kind: "public" | "authenticated" | "manual" | "partner";
  supports: {
    cnjSearch: boolean;
    batchSearch: boolean;
    partySearch: boolean;
    movements: boolean;
    documents: boolean;
    webhooks: boolean;
  };
  searchByCNJ(input: { cnj: string; tribunal?: string }): Promise<ConnectorSearchResult>;
  fetchMovements?(cnj: string): Promise<ConnectorMovement[]>;
  fetchDocuments?(cnj: string): Promise<ConnectorDocument[]>;
  healthCheck?(): Promise<boolean>;
}
