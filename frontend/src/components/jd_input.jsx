import { useState } from 'react'
import styles from './jd_input.module.css'

let API_BASE = 'http://localhost:8088'

export default function JDInput({ onComplete }) {
  const [mode, setMode] = useState('paste') // 'paste' | 'url'
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState('')

  API_BASE = window.location.origin

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    // const payload = mode === 'paste' ? { job_description: text } : { job_description: url }

    const payload = {"job_description":text}

    try {
      setLoadingStep('Analyzing job description...')
      await new Promise(r => setTimeout(r, 400))
      setLoadingStep('Generating interview questions...')

      const res = await fetch(`${API_BASE}/ai-interview-coach/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || data.detail?.error || 'Analysis failed')
      }

      onComplete(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const isReady = mode === 'paste' ? text.trim().length > 100 : url.trim().length > 10

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          ready to prep
        </div>
        <h1 className={styles.title}>
          Paste a job description.<br />
          <span className={styles.titleAccent}>We'll do the rest.</span>
        </h1>
        <p className={styles.subtitle}>
          The AI analyzes the role and generates targeted questions across behavioral,
          technical, system design, and domain-specific categories.
        </p>
      </div>

      <div className={styles.card}>
        {/* Mode toggle */}
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${mode === 'paste' ? styles.toggleActive : ''}`}
            onClick={() => { setMode('paste'); setError(null) }}
          >
            <span className={styles.toggleIcon}>⌨</span>
            Paste text
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'url' ? styles.toggleActive : ''}`}
            onClick={() => { setMode('url'); setError(null) }}
            disabled
            style={{opacity: '.5', pointerEvents: 'none'}}
          >
            <span className={styles.toggleIcon}>🔗</span>
            From URL ... coming soon
          </button>
        </div>

        {/* Input area */}
        {mode === 'paste' ? (
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              placeholder="Paste the full job description here..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={14}
            />
            <div className={styles.charCount}>
              {text.length > 0 && (
                <span className={text.length > 100 ? styles.charOk : styles.charWarn}>
                  {text.length} chars {text.length < 100 ? `— need ${100 - text.length} more` : '✓'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.urlWrap}>
            <div className={styles.urlPrefix}>https://</div>
            <input
              className={styles.urlInput}
              placeholder="jobs.lever.co/company/role-id"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
        )}

        {/* URL warning */}
        {mode === 'url' && (
          <div className={styles.urlNote}>
            <span className={styles.noteIcon}>⚠</span>
            LinkedIn, Workday, and Greenhouse require login — use paste mode for those.
            Lever and Ashby work great.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>✕</span>
            {error}
            {error.toLowerCase().includes('linkedin') || error.toLowerCase().includes('scraping') ? (
              <button className={styles.errorAction} onClick={() => { setMode('paste'); setError(null) }}>
                Switch to paste →
              </button>
            ) : null}
          </div>
        )}

        {/* Submit */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!isReady || loading}
        >
          {loading ? (
            <span className={styles.loadingRow}>
              <span className={styles.spinner} />
              {loadingStep}
            </span>
          ) : (
            <>
              Analyze & Generate Questions
              <span className={styles.submitArrow}>→</span>
            </>
          )}
        </button>
      </div>

      <div className={styles.hint}>
        <span className={styles.hintMono}>tip:</span> include the full JD for the most targeted questions
      </div>
    </div>
  )
}