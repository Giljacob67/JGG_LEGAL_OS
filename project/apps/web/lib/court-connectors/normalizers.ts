import { NormalizedProcess, NormalizedMovement } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataJud payload is unstructured external JSON
type DatajudPayload = Record<string, any>;

export function normalizeDatajudPayload(cnj: string, payload: DatajudPayload, tribunal?: string): NormalizedProcess {
  const classe = payload.classe?.nome;
  const orgaoJulgador = payload.orgaoJulgador?.nome;
  const assuntos = payload.assuntos?.map((a: DatajudPayload) => a.nome).filter(Boolean) || [];
  const assuntoPrincipal = assuntos[0];
  const dataAjuizamento = payload.dataAjuizamento;
  const situacao = payload.situacao;
  const valorCausa = payload.valorCausa;

  // Extract movements from DataJud payload
  const movimentos: NormalizedMovement[] = [];
  if (Array.isArray(payload.movimentos)) {
    for (const mov of payload.movimentos) {
      const data = mov.dataHora || mov.data;
      const nome = mov.nome || mov.complemento || "";
      const complementos = Array.isArray(mov.complementosTabelados)
        ? mov.complementosTabelados.map((c: DatajudPayload) => c.descricao || c.nome).filter(Boolean).join("; ")
        : "";
      const descricao = complementos ? `${nome} - ${complementos}` : nome;

      if (data && descricao) {
        movimentos.push({
          data,
          evento: String(nome).slice(0, 200),
          descricao: String(descricao).slice(0, 2000),
        });
      }
    }
  }

  return {
    cnj,
    fonte: "datajud",
    tribunal,
    classe,
    assunto: assuntoPrincipal,
    orgaoJulgador,
    situacao,
    distribuicao: dataAjuizamento,
    valorCausa,
    movimentos,
  };
}
