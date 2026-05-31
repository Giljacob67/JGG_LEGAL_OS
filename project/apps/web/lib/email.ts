import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "JGG Legal OS <noreply@jgg.law>";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logger.warn("[email] RESEND_API_KEY não configurada — email não enviado", { to: payload.to, subject: payload.subject });
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error("[email] Falha ao enviar via Resend", { status: res.status, err });
      return false;
    }

    logger.info("[email] Enviado", { to: payload.to, subject: payload.subject });
    return true;
  } catch (err) {
    logger.error("[email] Erro de conexão ao Resend", err);
    return false;
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

export function templateIntimacao(params: {
  advogadoNome: string;
  cnj: string;
  cliente: string;
  evento: string;
  descricao: string;
  data: string;
  processoUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Nova Intimação</title></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1e3a5f; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 18px;">⚠️ Nova Intimação Processual</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; margin: 0 0 16px;">Olá, <strong>${params.advogadoNome}</strong>,</p>
      <p style="color: #374151; margin: 0 0 24px;">Uma nova intimação foi detectada em um processo sob sua responsabilidade.</p>

      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">Processo</p>
        <p style="margin: 0 0 4px; font-family: monospace; font-size: 14px; color: #1c1917;">${params.cnj}</p>
        <p style="margin: 0; font-size: 13px; color: #78350f;">Cliente: ${params.cliente}</p>
      </div>

      <div style="border-left: 3px solid #f59e0b; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Evento — ${params.data}</p>
        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #111827;">${params.evento}</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">${params.descricao}</p>
      </div>

      <a href="${params.processoUrl}"
         style="display: inline-block; background: #1e3a5f; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
        Ver processo e andamentos →
      </a>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">JGG Legal OS — Sistema de Gestão Jurídica</p>
    </div>
  </div>
</body>
</html>`;
}

export function templatePrazoFatal(params: {
  advogadoNome: string;
  cnj: string;
  cliente: string;
  titulo: string;
  vence: string;
  diasRestantes: number;
  processoUrl: string;
}): string {
  const urgente = params.diasRestantes <= 3;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Prazo Fatal</title></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: ${urgente ? "#dc2626" : "#ea580c"}; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 18px;">${urgente ? "🚨" : "⏰"} Prazo Fatal — ${params.diasRestantes === 0 ? "HOJE" : `${params.diasRestantes} dia${params.diasRestantes > 1 ? "s" : ""}`}</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; margin: 0 0 16px;">Olá, <strong>${params.advogadoNome}</strong>,</p>
      <p style="color: #374151; margin: 0 0 24px;">
        ${urgente ? "<strong>ATENÇÃO URGENTE:</strong> " : ""}Um prazo fatal está se aproximando.
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #991b1b;">${params.titulo}</p>
        <p style="margin: 0 0 4px; font-family: monospace; font-size: 13px; color: #374151;">${params.cnj}</p>
        <p style="margin: 0 0 4px; font-size: 13px; color: #374151;">Cliente: ${params.cliente}</p>
        <p style="margin: 0; font-size: 13px; color: #dc2626; font-weight: 600;">Vencimento: ${params.vence}</p>
      </div>

      <a href="${params.processoUrl}"
         style="display: inline-block; background: ${urgente ? "#dc2626" : "#ea580c"}; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
        Ver processo e prazos →
      </a>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">JGG Legal OS — Sistema de Gestão Jurídica</p>
    </div>
  </div>
</body>
</html>`;
}
