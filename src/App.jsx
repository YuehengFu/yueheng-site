import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { experience, projects, notes, toolkit, EMAIL, GITHUB } from './content.js'
import { hasWebGL, useMedia, useTheme } from './hooks.js'
import { WIDE } from './scene/layout.js'

// three.js is the heavy part of the page; the text paints without waiting for it.
const Stage = lazy(() => import('./scene/Stage.jsx'))

function Backdrop({ theme }) {
  const [webgl] = useState(hasWebGL)
  const [ready, setReady] = useState(false)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const wide = useMedia(`(min-width: ${WIDE}px)`)
  const dim = useRef(null)
  const onReady = useCallback(() => setReady(true), [])

  // On narrow screens the cat sits above the intro; it fades back as the text
  // scrolls up over it, so the copy never sits on a bright model.
  useEffect(() => {
    const el = dim.current
    if (!el) return
    if (wide) {
      el.style.opacity = ''
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.55))
      el.style.opacity = String(1 - p * 0.86)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [wide])

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-dim" ref={dim}>
        {webgl ? (
          <div className="stage" data-ready={ready || undefined}>
            <Suspense fallback={null}>
              <Stage theme={theme} reduced={reduced} onReady={onReady} />
            </Suspense>
          </div>
        ) : (
          <div className="still">
            <img src={`${import.meta.env.BASE_URL}cat-still.webp`} alt="" width="900" height="1140" />
          </div>
        )}
      </div>
    </div>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" className="toggle" onClick={onToggle} aria-label={`switch to ${next} theme`}>
      <svg viewBox="0 0 20 20" aria-hidden="true" data-icon="moon">
        <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1Z" />
      </svg>
      <svg viewBox="0 0 20 20" aria-hidden="true" data-icon="sun">
        <circle cx="10" cy="10" r="3.4" />
        <path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
      </svg>
    </button>
  )
}

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }
  return (
    <button type="button" className="copy" onClick={copy} data-copied={copied || undefined}>
      <span className="copy-label">{copied ? 'copied' : 'copy'}</span>
      <span className="sr-only" role="status">
        {copied ? 'email address copied' : ''}
      </span>
    </button>
  )
}

export default function App() {
  const [theme, toggleTheme] = useTheme()

  return (
    <>
      <Backdrop theme={theme} />
      <a className="skip" href="#main">
        skip to content
      </a>

      <div className="page">
        <header className="top">
          <a className="name" href="#top">
            Yueheng Fu
          </a>
          <nav aria-label="sections">
            <a href="#experience">experience</a>
            <a href="#projects">projects</a>
            <a href="#contact">contact</a>
          </nav>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <main id="main" className="column">
          <section className="intro" id="top" aria-labelledby="hello">
            <h1 id="hello">hi, i&rsquo;m yueheng.</h1>
            <p>
              i&rsquo;m a first-year <mark>Systems Design Engineering</mark> student at the{' '}
              <mark>University of Waterloo</mark>, in co&#8209;op.
            </p>
            <p>
              before that i started YH Models, co&#8209;chaired the Markham Teen Arts Council, and was
              co&#8209;president of one of Ontario&rsquo;s largest DECA chapters.
            </p>
          </section>

          <section id="experience" aria-labelledby="experience-label">
            <h2 id="experience-label">experience</h2>
            <ul className="rows">
              {experience.map((item) => (
                <li key={item.org} className="row">
                  <p className="row-head">
                    {item.href ? (
                      <a className="row-title" href={item.href} target="_blank" rel="noreferrer">
                        {item.org}
                      </a>
                    ) : (
                      <span className="row-title">{item.org}</span>
                    )}
                    <span className="row-role">{item.role}</span>
                  </p>
                  <p className="row-body">{item.body}</p>
                  <p className="row-result">{item.result}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="projects" aria-labelledby="projects-label">
            <h2 id="projects-label">projects</h2>
            <ul className="rows">
              {projects.map((item) => (
                <li key={item.title} className="row">
                  <p className="row-head">
                    <a className="row-title" href={item.href} target="_blank" rel="noreferrer">
                      {item.title}
                      <span className="arrow" aria-hidden="true">
                        {' '}
                        &#8599;
                      </span>
                    </a>
                  </p>
                  <p className="row-body">{item.body}</p>
                  <p className="row-result">{item.tags}</p>
                </li>
              ))}
              <li className="row row-quiet">
                <p className="row-body">the next one is in development.</p>
              </li>
            </ul>
          </section>

          <section aria-labelledby="notes-label">
            <h2 id="notes-label">numbers</h2>
            <ul className="notes">
              {notes.map((n) => (
                <li key={n.lead}>
                  <span className="lead">{n.lead}</span> {n.text}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="toolkit-label">
            <h2 id="toolkit-label">toolkit</h2>
            <dl className="toolkit">
              {toolkit.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="contact" aria-labelledby="contact-label">
            <h2 id="contact-label">contact</h2>
            <p>the fastest way to reach me is email.</p>
            <ul className="links">
              <li className="email">
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                <CopyEmail />
              </li>
              <li>
                <a href={GITHUB} target="_blank" rel="noreferrer">
                  github
                </a>
              </li>
            </ul>
          </section>
        </main>

        <footer className="foot">
          <p>&copy; {new Date().getFullYear()} yueheng fu</p>
          <a href="#top">back to top</a>
        </footer>
      </div>
    </>
  )
}
