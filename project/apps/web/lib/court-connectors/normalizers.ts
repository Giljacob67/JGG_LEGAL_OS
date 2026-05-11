import { NormalizedProcess } from "./types";

export function normalizeDatajudPayload(cnj: string, payload: any, tribunal?: string): NormalizedProcess {
  const classe = payload.classe?.nome;
  const orgaoJulgador = payload.orgaoJulgador?.nome;
  const assuntos = payload.assuntos?.map((a: any) => a.nome).filter(Boolean) || [];
  const assuntoPrincipal = assuntos[0];
  const dataAjuizamento = payload.dataAjuizamento;
  const situacao = payload.situacao;
  const valorCausa = payload.valorCausa; // Sometimes present depending on Court

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
  };
}
