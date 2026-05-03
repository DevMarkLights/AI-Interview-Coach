import { useState } from 'react'
import styles from './interview_session.module.css'

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

export default function InterviewSession({question,questionNumber,totalQuestions,jdAnalysis,onEvaluationComplete,mobile}) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState(null)

  API_BASE = window.location.origin
  
  async function handleSubmit() {
    if (!answer.trim()) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/ai-interview-coach/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: [{ ...question, answer }],
          jd_analysis: jdAnalysis,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || data.detail?.error || 'Evaluation failed')
      setEvaluation(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    onEvaluationComplete(evaluation)
    setAnswer('')
    setEvaluation(null)
    setError(null)
  }

  const isLast = questionNumber === totalQuestions
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0

  return (
    <>
      {mobile ?
        <div className={styles.container}>
          {/* Top bar */}
          <div className={styles.topBar} style={{padding:'10px'}}>
            <div className={styles.modeBadge}>
              <span className={styles.modeIcon}>{MODE_ICONS[question.mode]}</span>
              {MODE_LABELS[question.mode]}
            </div>
            <div className={styles.questionCounter}>
              <span className={styles.counterCurrent}>{questionNumber}</span>
              <span className={styles.counterSep}>/</span>
              <span className={styles.counterTotal}>{totalQuestions}</span>
            </div>
          </div>

          <div className={styles.content}>
            {/* Question panel */}
            <div className={styles.questionPanel} style={{padding:'10px'}}>
              <div className={styles.questionLabel}>Question</div>
              <div className={styles.questionText}>{question.question}</div>
              {question.focus && (
                <div className={styles.focusRow}>
                  <span className={styles.focusLabel}>evaluating</span>
                  <span className={styles.focusText}>{question.focus}</span>
                </div>
              )}
              {question.mode === 'behavioral' && question.star_guidance && (
                <details className={styles.guidance}>
                  <summary className={styles.guidanceSummary}>
                    <span className={styles.guidanceIcon}>◐</span>
                    STAR guidance
                  </summary>
                  <div className={styles.guidanceBody}>{question.star_guidance}</div>
                </details>
              )}
              {question.mode !== 'behavioral' && (question.strong_answer_hints || question.key_considerations) && (
                <details className={styles.guidance}>
                  <summary className={styles.guidanceSummary}>
                    <span className={styles.guidanceIcon}>◐</span>
                    Answer hints
                  </summary>
                  <div className={styles.guidanceBody}>
                    {question.strong_answer_hints || question.key_considerations}
                  </div>
                </details>
              )}
            </div>

            {/* Answer area */}
            {!evaluation && (
              <div className={styles.answerPanel} style={{padding:'10px'}}>
                <div className={styles.answerHeader}>
                  <span className={styles.answerLabel}>Your Answer</span>
                  <span className={styles.wordCount}>
                    {wordCount > 0 ? `${wordCount} words` : ''}
                  </span>
                </div>
                <textarea
                  className={styles.textarea}
                  placeholder="Type your answer here. Be specific — use real examples from your experience..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={10}
                  disabled={loading}
                />
                {error && (
                  <div className={styles.error}>
                    <span>✕</span> {error}
                  </div>
                )}
                <div className={styles.answerFooter}>
                  <span className={styles.answerTip}>
                    {question.mode === 'behavioral'
                      ? 'tip: structure with Situation → Task → Action → Result'
                      : 'tip: be specific, discuss tradeoffs, tie to the role'}
                  </span>
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!answer.trim() || loading}
                  >
                    {loading ? (
                      <span className={styles.loadingRow}>
                        <span className={styles.spinner} />
                        Evaluating...
                      </span>
                    ) : (
                      <>Evaluate <span className={styles.arrow}>→</span></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Evaluation result */}
            {evaluation && (
              <div className={styles.evalPanel} style={{padding:'10px'}}>
                <EvaluationResult evaluation={evaluation} mode={question.mode} mobile={mobile} />
                <div className={styles.evalFooter}>
                  <button className={styles.nextBtn} onClick={handleNext}>
                    {isLast ? 'View Scorecard' : 'Next Question'}
                    <span className={styles.arrow}>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      :
        <div className={styles.container}>
          {/* Top bar */}
          <div className={styles.topBar}>
            <div className={styles.modeBadge}>
              <span className={styles.modeIcon}>{MODE_ICONS[question.mode]}</span>
              {MODE_LABELS[question.mode]}
            </div>
            <div className={styles.questionCounter}>
              <span className={styles.counterCurrent}>{questionNumber}</span>
              <span className={styles.counterSep}>/</span>
              <span className={styles.counterTotal}>{totalQuestions}</span>
            </div>
          </div>

          <div className={styles.content}>
            {/* Question panel */}
            <div className={styles.questionPanel}>
              <div className={styles.questionLabel}>Question</div>
              <div className={styles.questionText}>{question.question}</div>
              {question.focus && (
                <div className={styles.focusRow}>
                  <span className={styles.focusLabel}>evaluating</span>
                  <span className={styles.focusText}>{question.focus}</span>
                </div>
              )}
              {question.mode === 'behavioral' && question.star_guidance && (
                <details className={styles.guidance}>
                  <summary className={styles.guidanceSummary}>
                    <span className={styles.guidanceIcon}>◐</span>
                    STAR guidance
                  </summary>
                  <div className={styles.guidanceBody}>{question.star_guidance}</div>
                </details>
              )}
              {question.mode !== 'behavioral' && (question.strong_answer_hints || question.key_considerations) && (
                <details className={styles.guidance}>
                  <summary className={styles.guidanceSummary}>
                    <span className={styles.guidanceIcon}>◐</span>
                    Answer hints
                  </summary>
                  <div className={styles.guidanceBody}>
                    {question.strong_answer_hints || question.key_considerations}
                  </div>
                </details>
              )}
            </div>

            {/* Answer area */}
            {!evaluation && (
              <div className={styles.answerPanel}>
                <div className={styles.answerHeader}>
                  <span className={styles.answerLabel}>Your Answer</span>
                  <span className={styles.wordCount}>
                    {wordCount > 0 ? `${wordCount} words` : ''}
                  </span>
                </div>
                <textarea
                  className={styles.textarea}
                  placeholder="Type your answer here. Be specific — use real examples from your experience..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={10}
                  disabled={loading}
                />
                {error && (
                  <div className={styles.error}>
                    <span>✕</span> {error}
                  </div>
                )}
                <div className={styles.answerFooter}>
                  <span className={styles.answerTip}>
                    {question.mode === 'behavioral'
                      ? 'tip: structure with Situation → Task → Action → Result'
                      : 'tip: be specific, discuss tradeoffs, tie to the role'}
                  </span>
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!answer.trim() || loading}
                  >
                    {loading ? (
                      <span className={styles.loadingRow}>
                        <span className={styles.spinner} />
                        Evaluating...
                      </span>
                    ) : (
                      <>Evaluate <span className={styles.arrow}>→</span></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Evaluation result */}
            {evaluation && (
              <div className={styles.evalPanel}>
                <EvaluationResult evaluation={evaluation} mode={question.mode} />
                <div className={styles.evalFooter}>
                  <button className={styles.nextBtn} onClick={handleNext}>
                    {isLast ? 'View Scorecard' : 'Next Question'}
                    <span className={styles.arrow}>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      }
    </>
  )
}

function EvaluationResult({ evaluation, mode, mobile }) {
  const score = evaluation.score ?? 0
  const verdict = evaluation.verdict ?? 'Needs Work'

  const verdictClass = verdict === 'Strong'
    ? styles.verdictStrong
    : verdict === 'Adequate'
    ? styles.verdictAdequate
    : styles.verdictWeak

  return (
    <>
    {mobile ?
      <div className={styles.evalResult}>
        {/* Score header */}
        <div className={styles.scoreHeader}>
          <div className={styles.scoreCircle}>
            <svg viewBox="0 0 36 36" className={styles.scoreRing}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray={`${(score / 10) * 100} 100`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className={styles.scoreValue}>{score}</div>
          </div>
          <div className={styles.scoreInfo}>
            <div className={`${styles.verdict} ${verdictClass}`}>{verdict}</div>
            <div className={styles.scoreLabel}>out of 10</div>
          </div>
        </div>

        {/* STAR breakdown for behavioral */}
        {mode === 'behavioral' && evaluation.star_breakdown && (
          <div className={styles.starGrid}>
            {Object.entries(evaluation.star_breakdown).map(([key, val]) => (
              <div key={key} className={styles.starItem} style={{padding:'10px'}}>
                <div className={styles.starKey}>{key.toUpperCase()}</div>
                <div className={styles.starVal}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Technical/design breakdown */}
        {mode !== 'behavioral' && (
          <div className={styles.breakdownGrid}>
            {['accuracy', 'depth', 'relevance', 'architecture', 'scalability', 'tradeoffs', 'domain_depth', 'practical_experience', 'role_alignment'].map(key => {
              if (!evaluation[key]) return null
              return (
                <div key={key} className={styles.breakdownItem}>
                  <div className={styles.breakdownKey}>{key.replace(/_/g, ' ')}</div>
                  <div className={styles.breakdownVal}>{evaluation[key]}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className={styles.feedbackGrid}>
          <div className={styles.feedbackCol} style={{padding:'10px'}}>
            <div className={styles.feedbackLabel}>
              <span className={styles.feedbackDot} style={{ background: 'var(--accent)' }} />
              Strengths
            </div>
            <ul className={styles.feedbackList}>
              {(evaluation.strengths || []).map((s, i) => (
                <li key={i} className={styles.feedbackItem}>{s}</li>
              ))}
            </ul>
          </div>
          <div className={styles.feedbackCol} style={{padding:'10px'}}>
            <div className={styles.feedbackLabel}>
              <span className={styles.feedbackDot} style={{ background: 'var(--yellow)' }} />
              Improvements
            </div>
            <ul className={styles.feedbackList}>
              {(evaluation.improvements || []).map((s, i) => (
                <li key={i} className={styles.feedbackItemWarn}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sample addition */}
        {evaluation.sample_addition && (
          <div className={styles.sampleAddition} style={{padding:'10px'}}>
            <div className={styles.sampleLabel}>
              <span className={styles.sampleIcon}>✦</span>
              Could add
            </div>
            <div className={styles.sampleText}>{evaluation.sample_addition}</div>
          </div>
        )}
      </div>
    :
      <div className={styles.evalResult}>
        {/* Score header */}
        <div className={styles.scoreHeader}>
          <div className={styles.scoreCircle}>
            <svg viewBox="0 0 36 36" className={styles.scoreRing}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray={`${(score / 10) * 100} 100`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className={styles.scoreValue}>{score}</div>
          </div>
          <div className={styles.scoreInfo}>
            <div className={`${styles.verdict} ${verdictClass}`}>{verdict}</div>
            <div className={styles.scoreLabel}>out of 10</div>
          </div>
        </div>

        {/* STAR breakdown for behavioral */}
        {mode === 'behavioral' && evaluation.star_breakdown && (
          <div className={styles.starGrid}>
            {Object.entries(evaluation.star_breakdown).map(([key, val]) => (
              <div key={key} className={styles.starItem}>
                <div className={styles.starKey}>{key.toUpperCase()}</div>
                <div className={styles.starVal}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Technical/design breakdown */}
        {mode !== 'behavioral' && (
          <div className={styles.breakdownGrid}>
            {['accuracy', 'depth', 'relevance', 'architecture', 'scalability', 'tradeoffs', 'domain_depth', 'practical_experience', 'role_alignment'].map(key => {
              if (!evaluation[key]) return null
              return (
                <div key={key} className={styles.breakdownItem}>
                  <div className={styles.breakdownKey}>{key.replace(/_/g, ' ')}</div>
                  <div className={styles.breakdownVal}>{evaluation[key]}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className={styles.feedbackGrid}>
          <div className={styles.feedbackCol}>
            <div className={styles.feedbackLabel}>
              <span className={styles.feedbackDot} style={{ background: 'var(--accent)' }} />
              Strengths
            </div>
            <ul className={styles.feedbackList}>
              {(evaluation.strengths || []).map((s, i) => (
                <li key={i} className={styles.feedbackItem}>{s}</li>
              ))}
            </ul>
          </div>
          <div className={styles.feedbackCol}>
            <div className={styles.feedbackLabel}>
              <span className={styles.feedbackDot} style={{ background: 'var(--yellow)' }} />
              Improvements
            </div>
            <ul className={styles.feedbackList}>
              {(evaluation.improvements || []).map((s, i) => (
                <li key={i} className={styles.feedbackItemWarn}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sample addition */}
        {evaluation.sample_addition && (
          <div className={styles.sampleAddition}>
            <div className={styles.sampleLabel}>
              <span className={styles.sampleIcon}>✦</span>
              Could add
            </div>
            <div className={styles.sampleText}>{evaluation.sample_addition}</div>
          </div>
        )}
      </div>
    }
    </>
  )
}