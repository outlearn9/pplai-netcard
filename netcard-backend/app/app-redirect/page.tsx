import { redirect } from 'next/navigation'

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://app.pplai.app'

export default function AppRedirect() {
  redirect(FRONTEND)
}
