import { redirect } from 'next/navigation'

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://app.pplai.app'

// After Clerk OAuth (Google/LinkedIn), redirect to the SPA with ?oauth=1
// so AuthScreen's session check runs immediately rather than waiting for
// the 3-second profile fetch timeout.
export default function AppRedirect() {
  redirect(`${FRONTEND}?oauth=1`)
}
