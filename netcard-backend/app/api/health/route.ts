import { NextResponse } from 'next/server'

/**
 * GET Handler for /api/health
 * 
 * @returns {Promise<NextResponse>} 200 OK with status and timestamp.
 * @description Operational heartbeat endpoint to verify API connectivity and server health.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', ts: new Date().toISOString() })
}
