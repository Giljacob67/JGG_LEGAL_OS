const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

export interface DataJudProcesso {
  numeroProcesso: string;
  classe?: { nome?: string; codigo?: number };
  orgaoJulgador?: { nome?: string; codigoMunicipioIBGE?: number };
  formato?: { nome?: string };
  situacao?: string;
  assuntos?: { nome?: string; principal?: boolean }[];
  dataAjuizamento?: string;
  nivelSigilo?: string;
}

export async function buscarProcessoPorCNJ(cnj: string, tribunal?: string): Promise<DataJudProcesso | null> {
  const apiKey = process.env.DATAJUD_API_KEY;
  if (!apiKey) {
    throw new Error("DATAJUD_API_KEY nao configurada");
  }

  const tribunais = tribunal ? [tribunal] : ["tjpr", "tjmt", "tjsc", "tjrs", "tjgo", "trf1", "trf4", "stj"];

  for (const tj of tribunais) {
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
              "numeroProcesso.keyword": cnj.replace(/[^0-9]/g, ""),
            },
          },
          size: 1,
        }),
        next: { revalidate: 0 },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const hits = data?.hits?.hits;
      if (hits && hits.length > 0) {
        return hits[0]._source as DataJudProcesso;
      }
    } catch {
      continue;
    }
  }

  return null;
}