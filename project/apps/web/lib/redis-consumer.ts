import { getRedisSubscriber } from "./redis";
import { logger } from "./logger";

const CHANNEL = "jgg:eventos";

interface EventoAndamentosNovos {
  tipo: "andamentos_novos";
  cnj: string;
  tribunal: string;
  quantidade: number;
  criticos: number;
  andamentos_criticos: { data: string; evento: string }[];
  timestamp: string;
}

const handlers: ((event: EventoAndamentosNovos) => void)[] = [];

export function onAndamentosNovos(fn: (event: EventoAndamentosNovos) => void) {
  handlers.push(fn);
}

async function processarMensagem(raw: string): Promise<void> {
  let event: EventoAndamentosNovos;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }
  if (event.tipo !== "andamentos_novos") return;

  logger.info("Redis: andamentos novos recebidos", {
    cnj: event.cnj,
    tribunal: event.tribunal,
    novos: event.quantidade,
    criticos: event.criticos,
  });

  for (const fn of handlers) {
    try {
      fn(event);
    } catch (e) {
      logger.error("Redis consumer: erro no handler", e);
    }
  }
}

export async function startRedisConsumer(): Promise<void> {
  const sub = getRedisSubscriber();

  sub.on("error", (e) => {
    logger.error("Redis consumer: erro de conexão", e.message);
  });

  sub.on("reconnecting", () => {
    logger.info("Redis consumer: reconectando");
  });

  await sub.connect();
  await sub.subscribe(CHANNEL);

  sub.on("message", (_channel, message) => {
    processarMensagem(message).catch((e) =>
      logger.error("Redis consumer: erro ao processar mensagem", e)
    );
  });

  logger.info("Redis consumer: inscrito no canal", { channel: CHANNEL });
}
