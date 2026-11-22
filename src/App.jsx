import { Suspense, lazy, useState } from 'react'

// three.js and the scene load after the text, in their own chunk
const Stage = lazy(() => import('./scene/Stage.jsx'))
import { useReducedMotion, useTheme } from './hooks.js'
import { EMAIL, GITHUB, experience, otherwise, projects, tools } from './content.js'

function ThemeIcon({ theme }) {
  // drawn, not a glyph: a crescent in dark, a sun in light
  return theme === 'dark' ? (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M15.6 12.6A6.5 6.5 0 0 1 7.4 4.4a6.5 6.5 0 1 0 8.2 8.2Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.3 1.3M14.2 14.2l1.3 1.3M4.5 15.5l1.3-1.3M14.2 5.8l1.3-1.3" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
    </svg>
  )
}

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [paused, setPaused] = useState(false)
  const reduced = useReducedMotion()
  const other = theme === 'dark' ? 'light' : 'dark'

  return (
    <>
      <a className="skip" href="#main">
        skip to content
      </a>
      <Suspense fallback={null}>
        <Stage theme={theme} paused={paused} />
      </Suspense>

      <div className="page">
        <header className="top" data-enter>
          <a className="name" href="#top" aria-label="Yueheng Fu, back to top">
            yueheng fu
          </a>
          <nav className="nav" aria-label="Sections">
            <a href="#experience">experience</a>
            <a href="#projects">projects</a>
            <a href="#contact">contact</a>
          </nav>
          <button type="button" className="toggle" onClick={toggleTheme} aria-label={`Switch to ${other} theme`}>
            <ThemeIcon theme={theme} />
          </button>
        </header>

        <main id="main" className="col">
          <section className="intro" id="top" aria-labelledby="hi">
            <h1 id="hi" data-enter>
              hi, i&rsquo;m yueheng.
            </h1>
            <p data-enter>
              i&rsquo;m a first-year <mark>Systems Design Engineering</mark> student at the{' '}
              <mark>University of Waterloo</mark>, in the co‑op stream.
            </p>
            <p data-enter>
              i founded <mark>YH Models</mark>, where i design 3d‑printed low-poly figurines and sell them online. i
              also build small games in Java.
            </p>
          </section>

          <section className="block" id="experience" aria-labelledby="experience-h">
            <h2 id="experience-h">experience</h2>
            <ol className="rows">
              {experience.map((x) => (
                <li key={x.org} className="row">
                  <p className="row-head">
                    <strong>{x.org}</strong>
                    <span className="sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="muted">{x.role}</span>
                  </p>
                  <p>{x.text}</p>
                  <p className="note">{x.note}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="block" id="projects" aria-labelledby="projects-h">
            <h2 id="projects-h">projects</h2>
            <ul className="rows">
              {projects.map((p) => (
                <li key={p.title} className="row">
                  <p className="row-head row-split">
                    <a className="title-link" href={p.href} target="_blank" rel="noreferrer">
                      {p.title}
                      <Arrow />
                      <span className="sr-only"> (GitHub, opens in a new tab)</span>
                    </a>
                    <span className="muted small">{p.stack}</span>
                  </p>
                  <p>{p.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="block" id="otherwise" aria-labelledby="otherwise-h">
            <h2 id="otherwise-h">otherwise</h2>
            <ul className="list">
              {otherwise.map((o) => (
                <li key={o.lead}>
                  <strong>{o.lead}</strong> <span className="muted">{o.rest}</span>
                </li>
              ))}
            </ul>
            <p className="tools">
              <span className="muted">tools i use:</span> {tools}
            </p>
          </section>

          <section className="block" id="contact" aria-labelledby="contact-h">
            <h2 id="contact-h">contact</h2>
            <p>reach out by email, or find me on GitHub.</p>
            <p className="links">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <a href={GITHUB} target="_blank" rel="noreferrer">
                github
                <Arrow />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </section>
        </main>

        <footer className="foot col">
          <p>&copy; {new Date().getFullYear()} Yueheng Fu</p>
          {!reduced && (
            <button type="button" className="text-btn" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? 'let the cat float' : 'pause the cat'}
            </button>
          )}
        </footer>
      </div>
    </>
  )
}
