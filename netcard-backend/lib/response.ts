import { NextResponse } from 'next/server'

/**
 * Standardized success response envelope for Next.js APIs.
 * 
 * @param {unknown} data - The primary payload to be returned.
 * @param {number} status - The HTTP status code (defaults to 200).
 * @returns {NextResponse} Formatted JSON response with success: true and data property.
 */
export const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, data }, { status })

/**
 * Standardized error response envelope for Next.js APIs.
 * 
 * @param {string} message - Human-readable error description for the client.
 * @param {number} status - The HTTP status code (defaults to 400).
 * @returns {NextResponse} Formatted JSON response with success: false and error property.
 */
export const err = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status })

/**
 * Global catch-all handler for API exceptions.
 * Logs the error to standard out and translates common errors (like Auth failures) into HTTP status codes.
 * 
 * @param {unknown} e - The thrown exception object.
 * @returns {NextResponse} Formatted error response.
 */
export function handleError(e: unknown) {
  console.error(e)
  const msg = e instanceof Error ? e.message : 'Internal server error'
  const status = msg === 'Unauthenticated' ? 401 : 500
  return err(msg, status)
}
