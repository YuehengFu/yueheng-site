import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const THEME_COLOR = { dark: '#0b0c0e', light: '#eceef1' }

// index.html sets data-theme before first paint; React starts from that.
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', next)
      } catch {
        // Storage blocked: the choice just won't be remembered.
      }
      return next
    })
  }, [])

  return [theme, toggle]
}

function useMedia(query) {
  const subscribe = useCallback(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

const subscribeVisibility = (cb) => {
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}
export const usePageVisible = () => useSyncExternalStore(subscribeVisibility, () => !document.hidden)

// True while the element overlaps the viewport. Starts true so the first
// frames render before the observer reports.
export function useOnScreen(ref) {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return on
}

let webglCache
export function hasWebGL() {
  if (webglCache !== undefined) return webglCache
  try {
    const c = document.createElement('canvas')
    webglCache = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglCache = false
  }
  return webglCache
}
