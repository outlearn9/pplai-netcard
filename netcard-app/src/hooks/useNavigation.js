import { useState } from 'react'

const TAB_SCREENS = ['home', 'scan', 'mycard', 'events', 'ai', 'chatList', 'allContacts']

/**
 * Centralised navigation hook for the PPL-AI phone-shell SPA.
 *
 * Replaces the raw useState triplet (screen / screenData / activeTab) that
 * lived directly in App.jsx.  All 11 screens continue to receive the same
 * `navigate(to, data?)` prop — no screen file needs to change.
 *
 * Scale note: add new screens to SCREEN_MAP in App.jsx only.
 * If screens exceed ~20, consider migrating to wouter for URL-based routing.
 */
export function useNavigation(initial = 'home') {
  const [screen, setScreen]         = useState(initial)
  const [screenData, setScreenData] = useState(null)
  const [activeTab, setActiveTab]   = useState(initial)
  const [history, setHistory]       = useState([])

  function navigate(to, data = null) {
    setHistory(h => [...h, { screen, screenData }])
    setScreen(to)
    setScreenData(data)
    if (TAB_SCREENS.includes(to)) setActiveTab(to)
  }

  function goBack() {
    setHistory(h => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setScreen(prev.screen)
      setScreenData(prev.screenData)
      if (TAB_SCREENS.includes(prev.screen)) setActiveTab(prev.screen)
      return h.slice(0, -1)
    })
  }

  return {
    screen,
    screenData,
    activeTab,
    canGoBack: history.length > 0,
    showTabBar: TAB_SCREENS.includes(screen),
    navigate,
    goBack,
  }
}
