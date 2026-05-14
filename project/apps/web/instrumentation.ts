export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startRedisConsumer } = await import("./lib/redis-consumer");
    try {
      await startRedisConsumer();
    } catch (e) {
      console.error("[instrumentation] redis-consumer falhou ao iniciar:", e);
    }
  }
}
