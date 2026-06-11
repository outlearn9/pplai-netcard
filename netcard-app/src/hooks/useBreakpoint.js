import { useState, useEffect } from 'react'

function getBreakpoint(w) {
  if (w >= 900) return 'desktop'
  if (w >= 480) return 'tablet'
  return 'mobile'
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() => getBreakpoint(window.innerWidth))

  useEffect(() => {
    const handler = () => setBp(getBreakpoint(window.innerWidth))
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return bp
}
