import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { getConnector } from "../court-connectors/registry";
import { AuthUser } from "../auth";
import { NormalizedMovement } from "../court-connectors/types";

function createHash(payload: unknown): string {
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

// Fields that must NEVER be overwritten by automatic import
// Prefixed with _ to indicate intentional documentation constant for future enforcement
const _PROTECTED_FIELDS = [
  "tese",
  "estrategia",
  "risco",
  "valorProvavel",
  "proximosPassos",
  "observacoes",
  "observacoesConfidenciais",
] as const;
void _PROTECTED_FIELDS; // referenced to avoid unused warning

export class ImportService {

  // ============================================================
  // JOB MANAGEMENT
  // ============================================================

  static async createImportJob(
    user: AuthUser,
    tipo: string = "cnj_search",
    fonte: string = "datajud_public",
    total: number = 0,
  ) {
    const job = await prisma.processoImportJob.create({
      data: {
        tipo,
        fonte,
        status: "queued",
        total,
        iniciadoPorId: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "IMPORT_JOB_CREATED",
        entidade: "ProcessoImportJob",
        entidadeId: job.id,
        diff: { tipo, fonte, total } as unknown as Prisma.InputJsonValue,
      },
    });

    return job;
  }

  // ============================================================
  // CANDIDATE FROM SINGLE CNJ
  // ============================================================

  static async createCandidateFromCNJ(
    jobId: string,
    cnj: string,
    fonteId: string = "datajud_public",
    tribunal?: string,
  ) {
    const connector = getConnector(fonteId);
    if (!connector) throw new Error(`Conector ${fonteId} não encontrado`);

    const result = await connector.searchByCNJ({ cnj, tribunal });

    if (!result.success) {
      // Register failure as error candidate
      const candidate = await prisma.processoImportCandidate.create({
        data: {
          jobId,
          cnj: cnj.replace(/\D/g, ""),
          fonte: fonteId,
          status: "erro",
          motivoRejeicao: result.erro,
          dadosRaw: {},
        },
      });

      // Update Job failure counter
      await prisma.processoImportJob.update({
        where: { id: jobId },
        data: {
          processados: { increment: 1 },
          falhas: { increment: 1 },
        },
      });

      return candidate;
    }

    const cleanCnj = result.cnj;

    // Check if process already exists
    const existingProcesso = await prisma.processo.findUnique({
      where: { cnj: cleanCnj },
    });

    const status = existingProcesso ? "duplicado" : "novo";
    const conflitoComId = existingProcesso ? existingProcesso.id : null;

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
        dadosNormalizados: result.processoNormalizado as unknown as Prisma.InputJsonValue,
        conflitoComId,
      },
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
          },
        });
      } catch (err: unknown) {
        // P2002 = unique constraint on hash — same payload already stored
        if ((err as Record<string, unknown>).code !== "P2002") {
          console.error("Failed to create snapshot", err);
        }
      }
    }

    // Update Job stats
    await prisma.processoImportJob.update({
      where: { id: jobId },
      data: {
        processados: { increment: 1 },
        encontrados: { increment: 1 },
        duplicados: status === "duplicado" ? { increment: 1 } : undefined,
      },
    });

    return candidate;
  }

  // ============================================================
  // APPROVE CANDIDATE
  // ============================================================

  static async approveCandidate(candidateId: string, user: AuthUser, clienteId?: string) {
    const candidate = await prisma.processoImportCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) throw new Error("Candidato não encontrado");
    if (candidate.status === "aprovado") throw new Error("Candidato já aprovado");

    const dados = candidate.dadosNormalizados as Record<string, unknown> | null;
    if (!dados) throw new Error("Candidato não possui dados normalizados");

    let processoId = candidate.conflitoComId;

    if (!processoId) {
      // ---- CREATE NEW PROCESS ----
      if (!clienteId) throw new Error("ClienteId é obrigatório para novos processos");

      const processo = await prisma.processo.create({
        data: {
          cnj: candidate.cnj,
          clienteId: clienteId,
          responsavelId: user.id,
          tipo: (dados.tipo as string) || "Indefinido",
          area: inferArea(dados.classe as string, dados.assunto as string) as Prisma.Args<typeof prisma.processo, 'create'>['data']['area'],
          classe: dados.classe as string | undefined,
          assunto: dados.assunto as string | undefined,
          tribunal: dados.tribunal as string | undefined,
          vara: dados.orgaoJulgador as string | undefined,
          valorCausa: dados.valorCausa as number | undefined,
          distribuicao: dados.distribuicao ? new Date(dados.distribuicao as string) : undefined,
          status: "em_andamento",
          risco: "medio",
        },
      });
      processoId = processo.id;

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          acao: "CREATE_FROM_IMPORT",
          entidade: "Processo",
          entidadeId: processo.id,
          diff: {
            candidateId: candidate.id,
            cnj: candidate.cnj,
            fonte: candidate.fonte,
            tribunal: candidate.tribunal,
            jobId: candidate.jobId,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      // ---- UPDATE EXISTING PROCESS (duplicado) ----
      // Only update public metadata fields, NEVER touch protected strategic fields
      const existingProcesso = await prisma.processo.findUnique({
        where: { id: processoId },
      });

      if (existingProcesso) {
        const updateData: Record<string, unknown> = {};
        // Only fill in blanks — don't overwrite existing data
        if (!existingProcesso.classe && dados.classe) updateData.classe = dados.classe as string;
        if (!existingProcesso.assunto && dados.assunto) updateData.assunto = dados.assunto as string;
        if (!existingProcesso.tribunal && dados.tribunal) updateData.tribunal = dados.tribunal as string;
        if (!existingProcesso.vara && dados.orgaoJulgador) updateData.vara = dados.orgaoJulgador as string;
        if (!existingProcesso.distribuicao && dados.distribuicao) {
          updateData.distribuicao = new Date(dados.distribuicao as string);
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.processo.update({
            where: { id: processoId },
            data: updateData,
          });
        }

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            acao: "UPDATE_FROM_IMPORT",
            entidade: "Processo",
            entidadeId: processoId,
            diff: {
              candidateId: candidate.id,
              cnj: candidate.cnj,
              fonte: candidate.fonte,
              tribunal: candidate.tribunal,
              jobId: candidate.jobId,
              fieldsUpdated: Object.keys(updateData),
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    // Create or Update ProcessoFonte
    await prisma.processoFonte.upsert({
      where: {
        processoId_fonte_tribunal: {
          processoId: processoId,
          fonte: candidate.fonte,
          tribunal: candidate.tribunal || "",
        },
      },
      update: {
        ultimaSync: new Date(),
        statusSync: "ok",
        rawMeta: candidate.dadosRaw as Prisma.InputJsonValue,
      },
      create: {
        processoId: processoId,
        fonte: candidate.fonte,
        tribunal: candidate.tribunal,
        ultimaSync: new Date(),
        statusSync: "ok",
        rawMeta: candidate.dadosRaw as Prisma.InputJsonValue,
      },
    });

    // Import movements/andamentos (with deduplication)
    if (dados.movimentos && Array.isArray(dados.movimentos)) {
      await this.importAndamentos(processoId, dados.movimentos as NormalizedMovement[], candidate.fonte);
    }

    // Update snapshots to point to the correct Processo
    await prisma.processoRawSnapshot.updateMany({
      where: { candidateId: candidate.id },
      data: { processoId: processoId },
    });

    // Mark candidate as approved
    const updatedCandidate = await prisma.processoImportCandidate.update({
      where: { id: candidate.id },
      data: {
        status: "aprovado",
        processoId: processoId,
      },
    });

    // Audit log for approval
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "CANDIDATE_APPROVED",
        entidade: "ProcessoImportCandidate",
        entidadeId: candidate.id,
        diff: {
          jobId: candidate.jobId,
          cnj: candidate.cnj,
          fonte: candidate.fonte,
          tribunal: candidate.tribunal,
          processoId,
          isNewProcess: !candidate.conflitoComId,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedCandidate;
  }

  // ============================================================
  // REJECT CANDIDATE
  // ============================================================

  static async rejectCandidate(candidateId: string, motivo: string, user: AuthUser) {
    const candidate = await prisma.processoImportCandidate.update({
      where: { id: candidateId },
      data: {
        status: "rejeitado",
        motivoRejeicao: motivo,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "CANDIDATE_REJECTED",
        entidade: "ProcessoImportCandidate",
        entidadeId: candidateId,
        diff: {
          jobId: candidate.jobId,
          cnj: candidate.cnj,
          fonte: candidate.fonte,
          motivo,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return candidate;
  }

  // ============================================================
  // BATCH CNJ PROCESSING
  // ============================================================

  /**
   * Process a batch of CNJs for a given job.
   * Designed to run synchronously for now but structured for future worker migration.
   * 
   * @param jobId - The import job ID
   * @param cnjs - Array of normalized CNJ strings (20 digits)
   * @param fonte - Connector ID (default: datajud_public)
   * @param tribunal - Optional tribunal hint
   */
  static async processBatchCNJJob(
    jobId: string,
    cnjs: string[],
    fonte: string = "datajud_public",
    tribunal?: string,
  ) {
    // Mark job as running
    await prisma.processoImportJob.update({
      where: { id: jobId },
      data: { status: "running", total: cnjs.length },
    });

    let successCount = 0;
    let failureCount = 0;

    // Process synchronously (structured for future worker/queue migration)
    for (const cnj of cnjs) {
      try {
        await this.createCandidateFromCNJ(jobId, cnj, fonte, tribunal);
        successCount++;
      } catch (error) {
        console.error(`Erro ao importar CNJ ${cnj} no job ${jobId}:`, error);
        failureCount++;
        // Update failure count on the job
        await prisma.processoImportJob.update({
          where: { id: jobId },
          data: { falhas: { increment: 1 } },
        });
      }
    }

    // Determine final job status
    let finalStatus: string;
    if (successCount === 0 && failureCount > 0) {
      finalStatus = "failed";
    } else if (failureCount > 0) {
      finalStatus = "partial";
    } else {
      finalStatus = "done";
    }

    // Finalize Job
    const updatedJob = await prisma.processoImportJob.update({
      where: { id: jobId },
      data: { status: finalStatus },
    });

    return updatedJob;
  }

  // ============================================================
  // ANDAMENTOS (MOVEMENTS) IMPORT
  // ============================================================

  /**
   * Import movements as Andamento records, with hash-based deduplication.
   * Uses a composite of processoId + date + event text as dedup key.
   * 
   * TODO: Add proper hash column to Andamento model for robust dedup in future phase
   */
  private static async importAndamentos(
    processoId: string,
    movimentos: NormalizedMovement[],
    fonte: string,
  ) {
    if (!movimentos.length) return;

    // Get existing andamentos for this processo to deduplicate
    const existing = await prisma.andamento.findMany({
      where: { processoId, deletedAt: null },
      select: { data: true, evento: true },
    });

    // Create a set of existing "fingerprints"
    const existingFingerprints = new Set(
      existing.map((a) => `${a.data.toISOString().slice(0, 10)}|${a.evento.slice(0, 100)}`),
    );

    const toCreate: Array<{
      processoId: string;
      data: Date;
      evento: string;
      descricao: string;
      fonte: string;
    }> = [];

    for (const mov of movimentos) {
      try {
        const date = new Date(mov.data);
        if (isNaN(date.getTime())) continue;

        const fingerprint = `${date.toISOString().slice(0, 10)}|${mov.evento.slice(0, 100)}`;
        if (existingFingerprints.has(fingerprint)) continue;
        existingFingerprints.add(fingerprint); // prevent self-duplicates within batch

        toCreate.push({
          processoId,
          data: date,
          evento: mov.evento,
          descricao: mov.descricao,
          fonte,
        });
      } catch {
        // Skip malformed movements
        continue;
      }
    }

    if (toCreate.length > 0) {
      await prisma.andamento.createMany({ data: toCreate });

      // Update ultimo andamento on processo
      const latestDate = toCreate.reduce(
        (latest, a) => (a.data > latest ? a.data : latest),
        new Date(0),
      );
      if (latestDate > new Date(0)) {
        await prisma.processo.update({
          where: { id: processoId },
          data: { ultimoAndamento: latestDate },
        });
      }
    }
  }

  // ============================================================
  // GET JOB WITH STATS
  // ============================================================

  static async getJobWithCandidates(jobId: string) {
    return prisma.processoImportJob.findUnique({
      where: { id: jobId },
      include: {
        iniciadoPor: { select: { id: true, nome: true } },
        candidates: {
          orderBy: { createdAt: "desc" },
          take: 200,
        },
        _count: { select: { candidates: true } },
      },
    });
  }
}
