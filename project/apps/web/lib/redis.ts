import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let _subscriber: IORedis | null = null;

export function getRedisSubscriber(): IORedis {
  if (!_subscriber) {
    _subscriber = new IORedis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _subscriber;
}
