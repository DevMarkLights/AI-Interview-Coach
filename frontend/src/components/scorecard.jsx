import { useState, useEffect } from 'react'
import styles from './scorecard.module.css'

let API_BASE = 'http://localhost:8088'

const MODE_LABELS = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  system_design: 'System Design',
  role_specific: 'Role Specific',
}

const MODE_ICONS = {
  behavioral: '◈',
  technical: '⟨/⟩',
  system_design: '⬡',
  role_specific: '◎',
}

const SIGNAL_STYLES = {
  'Strong Yes': { color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(0,212,170,0.25)' },
  'Yes':        { color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(0,212,170,0.15)' },
  'Maybe':      { color: 'var(--yellow)', bg: 'var(--yellow-dim)', border: 'rgba(245,197,66,0.2)' },
  'No':         { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(255,95,95,0.2)'  },
}

export default function Scorecard({ evaluations, jdAnalysis, onRestart, onScorecardReady, mobile }) {
  const [scorecard, setScorecard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  API_BASE = window.location.origin
  
  useEffect(() => {
    async function fetchScorecard() {
      try {
        const res = await fetch(`${API_BASE}/ai-interview-coach/scorecard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evaluations, jd_analysis: jdAnalysis }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || data.detail?.error || 'Scorecard failed')
        setScorecard(data.result)
        onScorecardReady?.(data.result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchScorecard()
  }, [])

  if (loading) return <ScorecardLoading />
  if (error) return <ScorecardError error={error} onRestart={onRestart} />

  const signal = scorecard.hiring_signal
  const signalStyle = SIGNAL_STYLES[signal] || SIGNAL_STYLES['Maybe']

  return (
    <>
    {mobile ?
      <div className={styles.container}>
        <div className={styles.header} style={{padding:'10px'}}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            interview complete
          </div>
          <h2 className={styles.title}>Your Scorecard</h2>
          <p className={styles.subtitle}>
            {jdAnalysis.role_title} · {jdAnalysis.company}
          </p>
        </div>

        <div className={styles.content} style={{padding:'10px'}}>
          {/* Hero score row */}
          <div className={styles.heroRow}>
            <div className={styles.heroScore}>
              <ScoreRing score={scorecard.overall_score} size={96} strokeWidth={3} />
              <div className={styles.heroScoreLabel}>Overall Score</div>
            </div>

            <div className={styles.heroSignal} style={{
              background: signalStyle.bg,
              border: `1px solid ${signalStyle.border}`,
            }}>
              <div className={styles.signalLabel}>Hiring Signal</div>
              <div className={styles.signalValue} style={{ color: signalStyle.color }}>
                {signal}
              </div>
              <div className={styles.signalDesc}>{getSignalDesc(signal)}</div>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{evaluations.length}</span>
                <span className={styles.heroStatLabel}>Questions</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>
                  {Object.keys(scorecard.per_mode_scores).length}
                </span>
                <span className={styles.heroStatLabel}>Modes</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{scorecard.max_score}</span>
                <span className={styles.heroStatLabel}>Max Score</span>
              </div>
            </div>
          </div>

          {/* Per-mode scores */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Per-Mode Breakdown</div>
            <div className={styles.modeGrid}>
              {Object.entries(scorecard.per_mode_scores).map(([mode, score]) => (
                <div key={mode} className={styles.modeCard} style={{padding:'10px'}}>
                  <div className={styles.modeCardTop}>
                    <span className={styles.modeCardIcon}>{MODE_ICONS[mode]}</span>
                    <ScoreRing score={score} size={48} strokeWidth={3} />
                  </div>
                  <div className={styles.modeCardLabel}>{MODE_LABELS[mode] || mode}</div>
                  {scorecard.mode_summaries?.[mode] && (
                    <div className={styles.modeCardSummary}>
                      {scorecard.mode_summaries[mode]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className={styles.feedbackRow}>
            <div className={styles.feedbackCol}>
              <div className={styles.sectionLabel}>
                <span className={styles.labelDot} style={{ background: 'var(--accent)' }} />
                Top Strengths
              </div>
              <div className={styles.feedbackList}>
                {(scorecard.top_strengths || []).map((s, i) => (
                  <div key={i} className={styles.feedbackItem} style={{padding:'5px'}}>
                    <span className={styles.feedbackItemNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.feedbackItemText}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.feedbackCol}>
              <div className={styles.sectionLabel}>
                <span className={styles.labelDot} style={{ background: 'var(--yellow)' }} />
                Areas to Improve
              </div>
              <div className={styles.feedbackList}>
                {(scorecard.top_improvements || []).map((s, i) => (
                  <div key={i} className={styles.feedbackItemWarn} style={{padding:'5px'}}>
                    <span className={styles.feedbackItemNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.feedbackItemText}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall summary */}
          {scorecard.overall_summary && (
            <div className={styles.summary}>
              <div className={styles.sectionLabel}>Overall Assessment</div>
              <div className={styles.summaryText} style={{padding:'10px'}}>{scorecard.overall_summary}</div>
            </div>
          )}

          {/* Per-question review */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Question Review</div>
            <div className={styles.questionList}>
              {evaluations.map((ev, i) => (
                <div key={i} className={styles.questionRow}>
                  <div className={styles.questionRowLeft}>
                    <span className={styles.questionRowNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.questionRowMode}>{MODE_ICONS[ev.mode]}</span>
                    <span className={styles.questionRowText}>{ev.question}</span>
                  </div>
                  <div className={styles.questionRowRight}>
                    <span className={`${styles.questionRowVerdict} ${
                      ev.verdict === 'Strong' ? styles.verdictStrong :
                      ev.verdict === 'Adequate' ? styles.verdictAdequate :
                      styles.verdictWeak
                    }`}>{ev.verdict}</span>
                    <span className={styles.questionRowScore}>{ev.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.restartBtn} onClick={onRestart}>
              ↺ Start Over
            </button>
          </div>
        </div>
      </div>
    :
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            interview complete
          </div>
          <h2 className={styles.title}>Your Scorecard</h2>
          <p className={styles.subtitle}>
            {jdAnalysis.role_title} · {jdAnalysis.company}
          </p>
        </div>

        <div className={styles.content}>
          {/* Hero score row */}
          <div className={styles.heroRow}>
            <div className={styles.heroScore}>
              <ScoreRing score={scorecard.overall_score} size={96} strokeWidth={3} />
              <div className={styles.heroScoreLabel}>Overall Score</div>
            </div>

            <div className={styles.heroSignal} style={{
              background: signalStyle.bg,
              border: `1px solid ${signalStyle.border}`,
            }}>
              <div className={styles.signalLabel}>Hiring Signal</div>
              <div className={styles.signalValue} style={{ color: signalStyle.color }}>
                {signal}
              </div>
              <div className={styles.signalDesc}>{getSignalDesc(signal)}</div>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{evaluations.length}</span>
                <span className={styles.heroStatLabel}>Questions</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>
                  {Object.keys(scorecard.per_mode_scores).length}
                </span>
                <span className={styles.heroStatLabel}>Modes</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{scorecard.max_score}</span>
                <span className={styles.heroStatLabel}>Max Score</span>
              </div>
            </div>
          </div>

          {/* Per-mode scores */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Per-Mode Breakdown</div>
            <div className={styles.modeGrid}>
              {Object.entries(scorecard.per_mode_scores).map(([mode, score]) => (
                <div key={mode} className={styles.modeCard}>
                  <div className={styles.modeCardTop}>
                    <span className={styles.modeCardIcon}>{MODE_ICONS[mode]}</span>
                    <ScoreRing score={score} size={48} strokeWidth={3} />
                  </div>
                  <div className={styles.modeCardLabel}>{MODE_LABELS[mode] || mode}</div>
                  {scorecard.mode_summaries?.[mode] && (
                    <div className={styles.modeCardSummary}>
                      {scorecard.mode_summaries[mode]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className={styles.feedbackRow}>
            <div className={styles.feedbackCol}>
              <div className={styles.sectionLabel}>
                <span className={styles.labelDot} style={{ background: 'var(--accent)' }} />
                Top Strengths
              </div>
              <div className={styles.feedbackList}>
                {(scorecard.top_strengths || []).map((s, i) => (
                  <div key={i} className={styles.feedbackItem}>
                    <span className={styles.feedbackItemNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.feedbackItemText}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.feedbackCol}>
              <div className={styles.sectionLabel}>
                <span className={styles.labelDot} style={{ background: 'var(--yellow)' }} />
                Areas to Improve
              </div>
              <div className={styles.feedbackList}>
                {(scorecard.top_improvements || []).map((s, i) => (
                  <div key={i} className={styles.feedbackItemWarn}>
                    <span className={styles.feedbackItemNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.feedbackItemText}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall summary */}
          {scorecard.overall_summary && (
            <div className={styles.summary}>
              <div className={styles.sectionLabel}>Overall Assessment</div>
              <div className={styles.summaryText}>{scorecard.overall_summary}</div>
            </div>
          )}

          {/* Per-question review */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Question Review</div>
            <div className={styles.questionList}>
              {evaluations.map((ev, i) => (
                <div key={i} className={styles.questionRow}>
                  <div className={styles.questionRowLeft}>
                    <span className={styles.questionRowNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.questionRowMode}>{MODE_ICONS[ev.mode]}</span>
                    <span className={styles.questionRowText}>{ev.question}</span>
                  </div>
                  <div className={styles.questionRowRight}>
                    <span className={`${styles.questionRowVerdict} ${
                      ev.verdict === 'Strong' ? styles.verdictStrong :
                      ev.verdict === 'Adequate' ? styles.verdictAdequate :
                      styles.verdictWeak
                    }`}>{ev.verdict}</span>
                    <span className={styles.questionRowScore}>{ev.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.restartBtn} onClick={onRestart}>
              ↺ Start Over
            </button>
          </div>
        </div>
      </div>
    }
    </>

  )
}

// ── Score Ring ────────────────────────────────────────────
function ScoreRing({ score, size = 64, strokeWidth = 2.5 }) {
  const r = (size / 2) - strokeWidth * 2
  const circumference = 2 * Math.PI * r
  const fill = (score / 10) * circumference

  const color = score >= 7 ? 'var(--accent)' : score >= 5 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className={styles.scoreRingWrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${fill} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.scoreRingValue} style={{ fontSize: size * 0.22, color }}>
        {score}
      </div>
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────
function ScorecardLoading() {
  const steps = [
    'Analyzing your answers...',
    'Computing mode scores...',
    'Synthesizing feedback...',
    'Generating assessment...',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner} />
      <div className={styles.loadingStep}>{steps[step]}</div>
      <div className={styles.loadingDots}>
        {steps.map((_, i) => (
          <span key={i} className={`${styles.loadingDot} ${i === step ? styles.loadingDotActive : ''}`} />
        ))}
      </div>
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────
function ScorecardError({ error, onRestart }) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>✕</div>
      <div className={styles.errorTitle}>Scorecard generation failed</div>
      <div className={styles.errorMsg}>{error}</div>
      <button className={styles.restartBtn} onClick={onRestart}>↺ Start Over</button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────
function getSignalDesc(signal) {
  const map = {
    'Strong Yes': 'Exceptional performance across all modes.',
    'Yes':        'Solid candidate — ready to move forward.',
    'Maybe':      'Some gaps — further evaluation recommended.',
    'No':         'Significant gaps for this role at this time.',
  }
  return map[signal] || ''
}