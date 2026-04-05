import { Redis } from "@upstash/redis"

const upstash = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const redisClient = {
  get: async (key) => await upstash.get(key),
  setEx: async (key, seconds, value) => await upstash.setex(key, seconds, value),
  del: async (key) => await upstash.del(key),
}

export default redisClient;
