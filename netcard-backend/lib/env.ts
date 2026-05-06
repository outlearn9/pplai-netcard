import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL:    z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY:   z.string().min(10),
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY:            z.string().min(1),
  // OpenRouter
  OPENROUTER_API_KEY:          z.string().min(1),
  // Upstash Redis
  UPSTASH_REDIS_REST_URL:      z.string().url(),
  UPSTASH_REDIS_REST_TOKEN:    z.string().min(1),
  // Admin
  ADMIN_SECRET:                z.string().min(1),
  // Frontend CORS
  FRONTEND_URL:                z.string().url(),
})

// Skip validation in mock/dev mode so devs can run without real keys
if (process.env.NEXT_PUBLIC_MOCK_AUTH !== 'true') {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = Object.keys(result.error.flatten().fieldErrors)
    throw new Error(
      `[env] Missing or invalid environment variables: ${missing.join(', ')}\n` +
      'Set NEXT_PUBLIC_MOCK_AUTH=true to bypass validation during local development.'
    )
  }
}
