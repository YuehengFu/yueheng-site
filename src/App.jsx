import { lazy, Suspense, useState } from 'react'
import StaticCat from './cat/StaticCat.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { EMAIL, GITHUB, experience, projects, otherwise, toolkit } from './content.js'

// three.js arrives in its own chunk, after the text has painted.
const CatStage = lazy(() => import('./cat/CatStage.jsx'))

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M3 7 7 3M3.5 3H7v3.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export default function App() {
  const [gl] = useState(webglAvailable)
  const year = new Date().getFullYear()

  return (
    <>
      {gl ? (
        <Suspense fallback={null}>
          <CatStage />
        </Suspense>
      ) : (
        <div className="stage" aria-hidden="true">
          <StaticCat />
        </div>
      )}

      <a className="skip" href="#main">
        skip to content
      </a>

      <div className="page">
        <header className="bar">
          <a className="name" href="#top" aria-label="Yueheng Fu, back to top">
            yueheng fu
          </a>
          <nav aria-label="Sections">
            <a href="#experience">experience</a>
            <a href="#projects">projects</a>
            <a href="#contact">contact</a>
          </nav>
          <ThemeToggle />
        </header>

        <main id="main" className="column">
          <section className="hero" id="top" aria-labelledby="hi">
            <h1 id="hi">hi, i&rsquo;m yueheng.</h1>
            <p>
              i&rsquo;m a first-year <span className="mark">Systems Design Engineering</span> student at the{' '}
              <span className="mark">University of Waterloo</span>.
            </p>
            <p className="quiet">
              before that: low-poly figurines, an arts council, a DECA chapter, and a couple of java games. the
              line-drawn cat is meowmeow.
            </p>
          </section>

          <section id="experience" aria-labelledby="experience-h">
            <h2 id="experience-h">experience</h2>
            <ul className="rows">
              {experience.map((e) => (
                <li key={e.org} className="row">
                  <p className="row-head">
                    <strong>{e.org}</strong>
                    <span className="sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="role">{e.role}</span>
                  </p>
                  <span className="figure">{e.figure}</span>
                  <p className="row-text">{e.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="projects" aria-labelledby="projects-h">
            <h2 id="projects-h">projects</h2>
            <ul className="rows">
              {projects.map((p) => (
                <li key={p.title} className="row">
                  <p className="row-head">
                    <a href={p.href} target="_blank" rel="noreferrer">
                      <strong>{p.title}</strong>
                      <Arrow />
                      <span className="sr-only"> (source on GitHub, opens in a new tab)</span>
                    </a>
                  </p>
                  <span className="figure">{p.tags}</span>
                  <p className="row-text">{p.text}</p>
                </li>
              ))}
              <li className="row row-quiet">
                <p className="row-head">next project</p>
                <span className="figure">in progress</span>
                <p className="row-text">in development. check back soon.</p>
              </li>
            </ul>
          </section>

          <section id="otherwise" aria-labelledby="otherwise-h">
            <h2 id="otherwise-h">otherwise</h2>
            <ul className="notes">
              {otherwise.map((o) => (
                <li key={o.lead}>
                  <strong>{o.lead}</strong>
                  <span className="sep" aria-hidden="true">
                    ·
                  </span>
                  {o.text}
                </li>
              ))}
            </ul>
            <dl className="kit">
              {toolkit.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="contact" aria-labelledby="contact-h">
            <h2 id="contact-h">contact</h2>
            <p>reach out by email, or find me on github.</p>
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

        <footer className="foot">
          <span>&copy; {year} yueheng fu</span>
          <a href="#top">back to top</a>
        </footer>
      </div>
    </>
  )
}
