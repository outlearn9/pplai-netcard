import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Public endpoint: 20 requests per minute per IP
export const publicRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'rl:public',
})

// AI endpoint: hourly + daily caps driven by env vars
export const aiRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.AI_USAGE_LIMIT_PER_HOUR ?? '20'),
    '1 h',
  ),
  prefix: 'rl:ai:hour',
})

export const aiDailyRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.AI_USAGE_LIMIT_PER_DAY ?? '200'),
    '24 h',
  ),
  prefix: 'rl:ai:day',
})