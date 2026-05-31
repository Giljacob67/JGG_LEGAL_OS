import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Workflow } from "@prisma/client";
import { sendEmail } from "@/lib/email";

interface TriggerContext {
  entidade: string;
  entidadeId: string;
  dados: any;
}

interface AcaoResultado {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
}

/**
 * Serviço responsável por executar workflows baseados em triggers
 */
export class WorkflowExecutor {
  /**
   * Executa todos os workflows ativos para um determinado trigger
   */
  static async executarWorkflows(trigger: string, context: TriggerContext) {
    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          trigger,
          ativo: true,
        },
      });

      logger.info(`Encontrados ${workflows.length} workflows para trigger: ${trigger}`);

      for (const workflow of workflows) {
        await this.executarWorkflow(workflow, context);
      }
    } catch (error) {
      logger.error("Erro ao executar workflows", error);
    }
  }

  /**
   * Executa um workflow específico
   */
  static async executarWorkflow(workflow: Workflow, context: TriggerContext) {
    try {
      // Verificar condições
      if (!this.verificarCondicoes(workflow.condicoes as any, context)) {
        logger.info(`Workflow ${workflow.id} não atendeu às condições`);
        return;
      }

      logger.info(`Executando workflow ${workflow.id} para ${context.entidade} ${context.entidadeId}`);

      // Executar ações
      const acoes = workflow.acoes as any[];
      const resultados: AcaoResultado[] = [];

      for (const acao of acoes) {
        const resultado = await this.executarAcao(acao, context, workflow);
        resultados.push(resultado);
      }

      // Registrar log de execução
      const todosSucesso = resultados.every((r) => r.sucesso);
      await prisma.workflowLog.create({
        data: {
          workflowId: workflow.id,
          entidade: context.entidade,
          entidadeId: context.entidadeId,
          status: todosSucesso ? "sucesso" : "erro",
          resultado: resultados as any,
          erro: todosSucesso ? null : resultados.filter((r) => !r.sucesso).map((r) => r.erro).join("; "),
        },
      });

      // Atualizar contador de execuções
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: {
          totalExecucoes: { increment: 1 },
          ultimaExecucao: new Date(),
        },
      });

      logger.info(`Workflow ${workflow.id} executado com ${todosSucesso ? "sucesso" : "erros"}`);
    } catch (error) {
      logger.error(`Erro ao executar workflow ${workflow.id}`, error);
      
      // Registrar erro no log
      await prisma.workflowLog.create({
        data: {
          workflowId: workflow.id,
          entidade: context.entidade,
          entidadeId: context.entidadeId,
          status: "erro",
          erro: error instanceof Error ? error.message : "Erro desconhecido",
        },
      });
    }
  }

  /**
   * Verifica se as condições do workflow foram atendidas
   */
  private static verificarCondicoes(condicoes: any, context: TriggerContext): boolean {
    if (!condicoes || Object.keys(condicoes).length === 0) {
      return true; // Sem condições = sempre executa
    }

    // Exemplo de condições para trigger "prazo_proximo"
    if (context.entidade === "Prazo") {
      const prazo = context.dados;
      
      if (condicoes.dias !== undefined) {
        const diasParaVencimento = Math.ceil(
          (new Date(prazo.vence).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (diasParaVencimento > condicoes.dias) {
          return false;
        }
      }

      if (condicoes.status && prazo.status !== condicoes.status) {
        return false;
      }
    }

    // Exemplo de condições para trigger "andamento_critico"
    if (context.entidade === "Andamento") {
      const andamento = context.dados;
      
      if (condicoes.apenasCriticos && !andamento.critico) {
        return false;
      }
    }

    return true;
  }

  /**
   * Executa uma ação específica
   */
  private static async executarAcao(
    acao: any,
    context: TriggerContext,
    workflow: Workflow
  ): Promise<AcaoResultado> {
    try {
      switch (acao.tipo) {
        case "email":
          return await this.executarAcaoEmail(acao, context);
        
        case "notificacao":
          return await this.executarAcaoNotificacao(acao, context);
        
        case "criar_tarefa":
          return await this.executarAcaoCriarTarefa(acao, context, workflow);
        
        case "atualizar_campo":
          return await this.executarAcaoAtualizarCampo(acao, context);
        
        default:
          return {
            sucesso: false,
            erro: `Tipo de ação desconhecido: ${acao.tipo}`,
          };
      }
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Ação: Enviar email
   */
  private static async executarAcaoEmail(
    acao: any,
    context: TriggerContext
  ): Promise<AcaoResultado> {
    try {
      const enviado = await sendEmail({
        to: acao.para,
        subject: acao.assunto,
        html: `<p>${String(acao.corpo ?? acao.mensagem ?? "").replace(/\n/g, "<br>")}</p>`,
      });

      return {
        sucesso: enviado,
        mensagem: enviado ? `Email enviado para ${acao.para}` : "Email não enviado (RESEND_API_KEY ausente)",
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao enviar email",
      };
    }
  }

  /**
   * Ação: Criar notificação
   */
  private static async executarAcaoNotificacao(
    acao: any,
    context: TriggerContext
  ): Promise<AcaoResultado> {
    try {
      // TODO: Implementar sistema de notificações real
      logger.info(`[WORKFLOW] Notificação criada: ${acao.mensagem}`);
      
      return {
        sucesso: true,
        mensagem: "Notificação criada",
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao criar notificação",
      };
    }
  }

  /**
   * Ação: Criar tarefa
   */
  private static async executarAcaoCriarTarefa(
    acao: any,
    context: TriggerContext,
    workflow: Workflow
  ): Promise<AcaoResultado> {
    try {
      // Obter processo relacionado
      let processoId = context.entidadeId;
      
      if (context.entidade === "Prazo" || context.entidade === "Andamento") {
        processoId = context.dados.processoId;
      }

      if (!processoId) {
        return {
          sucesso: false,
          erro: "Não foi possível identificar o processo",
        };
      }

      const tarefa = await prisma.task.create({
        data: {
          titulo: acao.titulo || `Tarefa automática - ${workflow.nome}`,
          descricao: acao.descricao || `Criada automaticamente pelo workflow ${workflow.nome}`,
          processoId,
          responsavelId: acao.responsavelId || workflow.criadoPorId,
          status: "aberta",
          prioridade: acao.prioridade || "media",
        },
      });

      return {
        sucesso: true,
        mensagem: `Tarefa ${tarefa.id} criada`,
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao criar tarefa",
      };
    }
  }

  /**
   * Ação: Atualizar campo de uma entidade
   */
  private static async executarAcaoAtualizarCampo(
    acao: any,
    context: TriggerContext
  ): Promise<AcaoResultado> {
    try {
      if (!acao.entidade || !acao.campo || acao.valor === undefined) {
        return {
          sucesso: false,
          erro: "Ação de atualização requer entidade, campo e valor",
        };
      }

      // Exemplo: atualizar status de um processo
      if (acao.entidade === "Processo") {
        await prisma.processo.update({
          where: { id: context.entidadeId },
          data: { [acao.campo]: acao.valor },
        });
      }

      return {
        sucesso: true,
        mensagem: `Campo ${acao.campo} atualizado`,
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao atualizar campo",
      };
    }
  }
}
