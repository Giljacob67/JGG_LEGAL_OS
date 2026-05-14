import { getRedisSubscriber } from "./redis";

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

  console.log(
    `[redis-consumer] andamentos_novos cnj=${event.cnj} tribunal=${event.tribunal} novos=${event.quantidade} criticos=${event.criticos}`
  );

  for (const fn of handlers) {
    try {
      fn(event);
    } catch (e) {
      console.error("[redis-consumer] handler erro:", e);
    }
  }
}

export async function startRedisConsumer(): Promise<void> {
  const sub = getRedisSubscriber();

  sub.on("error", (e) => {
    console.error("[redis-consumer] conexão erro:", e.message);
  });

  sub.on("reconnecting", () => {
    console.log("[redis-consumer] reconectando...");
  });

  await sub.connect();
  await sub.subscribe(CHANNEL);

  sub.on("message", (_channel, message) => {
    processarMensagem(message).catch((e) =>
      console.error("[redis-consumer] process erro:", e)
    );
  });

  console.log(`[redis-consumer] subscribed canal=${CHANNEL}`);
}
