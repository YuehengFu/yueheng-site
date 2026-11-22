import { useState } from 'react'

const current = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export default function ThemeToggle() {
  const [theme, setTheme] = useState(current)
  const next = theme === 'dark' ? 'light' : 'dark'

  const toggle = () => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
    setTheme(next)
  }

  return (
    <button type="button" className="toggle" onClick={toggle} aria-label={`switch to ${next} theme`} title={`${next} theme`}>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        {theme === 'dark' ? (
          // a moon: you are in the dark theme
          <path d="M15.5 12.3A6 6 0 0 1 7.7 4.5a6 6 0 1 0 7.8 7.8Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        ) : (
          // a sun: you are in the light theme
          <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <circle cx="10" cy="10" r="3.2" />
            <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3 6 14M14 6l1.3-1.3" />
          </g>
        )}
      </svg>
    </button>
  )
}
