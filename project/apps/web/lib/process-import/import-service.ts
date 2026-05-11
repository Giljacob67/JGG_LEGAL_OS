import crypto from "crypto";
import { prisma } from "../db";
import { getConnector } from "../court-connectors/registry";
import { AuthUser } from "../auth";

function createHash(payload: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function inferArea(classe?: string, assunto?: string): string {
  const t = `${classe || ""} ${assunto || ""}`.toLowerCase();
  if (t.includes("trabalhista") || t.includes("trabalho")) return "trabalhista";
  if (t.includes("tribut") || t.includes("imposto") || t.includes("taxa")) return "tributario";
  if (t.includes("penal") || t.includes("crime") || t.includes("criminal")) return "penal";
  if (t.includes("empresa") || t.includes("falência") || t.includes("sociedade")) return "empresarial";
  if (t.includes("banco") || t.includes("bancário") || t.includes("revisional")) return "bancario";
  if (t.includes("agrári")) return "agrario";
  return "civil"; // Default fallback
}

export class ImportService {
  
  static async createImportJob(user: AuthUser, tipo: string = "cnj_search", fonte: string = "datajud_public") {
    return prisma.processoImportJob.create({
      data: {
        tipo,
        fonte,
        status: "em_progresso",
        iniciadoPorId: user.id,
      }
    });
  }

  static async createCandidateFromCNJ(jobId: string, cnj: string, fonteId: string = "datajud_public") {
    const connector = getConnector(fonteId);
    if (!connector) throw new Error(`Conector ${fonteId} não encontrado`);

    const result = await connector.searchByCNJ({ cnj });
    
    if (!result.success) {
      // Registrar falha como candidato com erro
      return prisma.processoImportCandidate.create({
        data: {
          jobId,
          cnj: cnj.replace(/\\D/g, ""),
          fonte: fonteId,
          status: "erro",
          motivoRejeicao: result.erro,
          dadosRaw: {},
        }
      });
    }

    const cleanCnj = result.cnj;
    
    // Check if process already exists
    const existingProcesso = await prisma.processo.findUnique({
      where: { cnj: cleanCnj },
    });

    let status = existingProcesso ? "duplicado" : "novo";
    let conflitoComId = existingProcesso ? existingProcesso.id : null;

    // Create Candidate
    const candidate = await prisma.processoImportCandidate.create({
      data: {
        jobId,
        cnj: cleanCnj,
        fonte: fonteId,
        tribunal: result.tribunalEncontrado,
        status,
        scoreConfianca: result.scoreConfianca,
        dadosRaw: result.payloadBruto || {},
        dadosNormalizados: result.processoNormalizado as any,
        conflitoComId,
      }
    });

    // Create Raw Snapshot
    if (result.payloadBruto) {
      const hash = createHash(result.payloadBruto);
      try {
        await prisma.processoRawSnapshot.create({
          data: {
            candidateId: candidate.id,
            processoId: existingProcesso?.id,
            fonte: fonteId,
            hash,
            payload: result.payloadBruto,
          }
        });
      } catch (err: any) {
        // If hash exists, just ignore. It means exact same payload is already in DB.
        if (err.code !== 'P2002') {
          console.error("Failed to create snapshot", err);
        }
      }
    }

    // Update Job stats
    await prisma.processoImportJob.update({
      where: { id: jobId },
      data: {
        total: { increment: 1 },
        processados: { increment: 1 },
        encontrados: { increment: 1 },
        duplicados: status === "duplicado" ? { increment: 1 } : undefined,
      }
    });

    return candidate;
  }

  static async approveCandidate(candidateId: string, user: AuthUser, clienteId?: string) {
    const candidate = await prisma.processoImportCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) throw new Error("Candidato não encontrado");
    if (candidate.status === "aprovado") throw new Error("Candidato já aprovado");
    
    const dados = candidate.dadosNormalizados as any;
    if (!dados) throw new Error("Candidato não possui dados normalizados");

    let processoId = candidate.conflitoComId;

    if (!processoId) {
      if (!clienteId) throw new Error("ClienteId é obrigatório para novos processos");
      
      // Create new process
      const processo = await prisma.processo.create({
        data: {
          cnj: candidate.cnj,
          clienteId: clienteId,
          responsavelId: user.id,
          tipo: dados.tipo || "Indefinido",
          area: inferArea(dados.classe, dados.assunto) as any,
          classe: dados.classe,
          assunto: dados.assunto,
          tribunal: dados.tribunal,
          vara: dados.orgaoJulgador,
          valorCausa: dados.valorCausa,
          distribuicao: dados.distribuicao ? new Date(dados.distribuicao) : undefined,
          status: "em_andamento",
          risco: "medio",
        }
      });
      processoId = processo.id;

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          acao: "CREATE_FROM_IMPORT",
          entidade: "Processo",
          entidadeId: processo.id,
          diff: { candidateId: candidate.id } as any,
        }
      });
    }

    // Create or Update ProcessoFonte
    await prisma.processoFonte.upsert({
      where: {
        processoId_fonte_tribunal: {
          processoId: processoId,
          fonte: candidate.fonte,
          tribunal: candidate.tribunal || "",
        }
      },
      update: {
        ultimaSync: new Date(),
        statusSync: "ok",
        rawMeta: candidate.dadosRaw as any,
      },
      create: {
        processoId: processoId,
        fonte: candidate.fonte,
        tribunal: candidate.tribunal,
        ultimaSync: new Date(),
        statusSync: "ok",
        rawMeta: candidate.dadosRaw as any,
      }
    });

    // Update snapshots to point to the correct Processo
    await prisma.processoRawSnapshot.updateMany({
      where: { candidateId: candidate.id },
      data: { processoId: processoId }
    });

    // Mark candidate as approved
    const updatedCandidate = await prisma.processoImportCandidate.update({
      where: { id: candidate.id },
      data: { 
        status: "aprovado",
        processoId: processoId
      }
    });

    return updatedCandidate;
  }

  static async rejectCandidate(candidateId: string, motivo: string) {
    const candidate = await prisma.processoImportCandidate.update({
      where: { id: candidateId },
      data: {
        status: "rejeitado",
        motivoRejeicao: motivo,
      }
    });

    return candidate;
  }
}
