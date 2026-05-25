import { logger } from "./lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startRedisConsumer } = await import("./lib/redis-consumer");
    try {
      await startRedisConsumer();
    } catch (e) {
      logger.error("Redis consumer falhou ao iniciar", e);
    }
  }
}
