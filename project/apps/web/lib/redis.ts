import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let _subscriber: IORedis | null = null;
let _client: IORedis | null = null;

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

export function getRedis(): IORedis {
  if (!_client) {
    _client = new IORedis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }
  return _client;
}
