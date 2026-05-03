import { useState } from 'react'
import JDInput from './components/jd_input'
import ModeSelector from './components/mode_selector'
import InterviewSession from './components/interview_session'
import Scorecard from './components/scorecard'
import styles from './app.module.css'

const VIEWS = {
  INPUT: 'input',
  MODES: 'modes',
  SESSION: 'session',
  SCORECARD: 'scorecard',
}

const ALL_MODES = ['behavioral', 'technical', 'system_design', 'role_specific']

const MODE_LABELS = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  system_design: 'System Design',
  role_specific: 'Role Specific',
}

export default function App() {
  const [view, setView] = useState(VIEWS.INPUT)
  const [jdAnalysis, setJdAnalysis] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selectedModes, setSelectedModes] = useState(ALL_MODES)
  const [evaluations, setEvaluations] = useState([])
  const [scorecard, setScorecard] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filtered questions based on selected modes
  const activeQuestions = questions.filter(q => selectedModes.includes(q.mode))

  function handleAnalyzeComplete({ jd_analysis, questions }) {
    setJdAnalysis(jd_analysis)
    setQuestions(questions)
    setView(VIEWS.MODES)
  }

  function handleModesConfirmed() {
    setCurrentIndex(0)
    setEvaluations([])
    setView(VIEWS.SESSION)
  }

  function handleEvaluationComplete(evaluation) {
    const updated = [...evaluations, evaluation]
    setEvaluations(updated)

    if (currentIndex + 1 >= activeQuestions.length) {
      // All questions answered — go to scorecard
      setView(VIEWS.SCORECARD)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  function handleScorecardReady(scorecard) {
    setScorecard(scorecard)
  }

  function handleRestart() {
    setView(VIEWS.INPUT)
    setJdAnalysis(null)
    setQuestions([])
    setSelectedModes(ALL_MODES)
    setEvaluations([])
    setScorecard(null)
    setCurrentIndex(0)
  }

  // Sidebar step indicators
  const steps = [
    { id: VIEWS.INPUT, label: 'Job Description', icon: '01' },
    { id: VIEWS.MODES, label: 'Select Modes', icon: '02' },
    { id: VIEWS.SESSION, label: 'Interview', icon: '03' },
    { id: VIEWS.SCORECARD, label: 'Scorecard', icon: '04' },
  ]

  const viewOrder = [VIEWS.INPUT, VIEWS.MODES, VIEWS.SESSION, VIEWS.SCORECARD]
  const currentStep = viewOrder.indexOf(view)

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>interview<span className={styles.logoAccent}>.ai</span></span>
          <span className={styles.logoSub}>coached by llm</span>
        </div>

        <nav className={styles.steps}>
          {steps.map((step, i) => {
            const isComplete = i < currentStep
            const isActive = i === currentStep
            return (
              <div
                key={step.id}
                className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isComplete ? styles.stepComplete : ''}`}
              >
                <span className={styles.stepIcon}>
                  {isComplete ? '✓' : step.icon}
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
                {isActive && <span className={styles.stepDot} />}
              </div>
            )
          })}
        </nav>

        {/* Session info panel — shows after analysis */}
        {jdAnalysis && (
          <div className={styles.sessionInfo}>
            <div className={styles.sessionRole}>{jdAnalysis.role_title}</div>
            <div className={styles.sessionCompany}>{jdAnalysis.company}</div>
            <div className={styles.sessionMeta}>
              <span className={styles.badge}>{jdAnalysis.seniority}</span>
              <span className={styles.badge}>{jdAnalysis.domain}</span>
            </div>
            {view === VIEWS.SESSION && (
              <div className={styles.sessionProgress}>
                <div className={styles.progressLabel}>
                  <span>Progress</span>
                  <span>{currentIndex}/{activeQuestions.length}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(currentIndex / activeQuestions.length) * 100}%` }}
                  />
                </div>
                <div className={styles.modePills}>
                  {selectedModes.map(mode => (
                    <span key={mode} className={styles.modePill}>
                      {MODE_LABELS[mode]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <span className={styles.footerText}>marks-pi.com</span>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {view === VIEWS.INPUT && (
          <JDInput onComplete={handleAnalyzeComplete} />
        )}
        {view === VIEWS.MODES && (
          <ModeSelector
            selectedModes={selectedModes}
            setSelectedModes={setSelectedModes}
            questions={questions}
            onConfirm={handleModesConfirmed}
          />
        )}
        {view === VIEWS.SESSION && (
          <InterviewSession
            question={activeQuestions[currentIndex]}
            questionNumber={currentIndex + 1}
            totalQuestions={activeQuestions.length}
            jdAnalysis={jdAnalysis}
            onEvaluationComplete={handleEvaluationComplete}
          />
        )}
        {view === VIEWS.SCORECARD && (
          <Scorecard
            evaluations={evaluations}
            jdAnalysis={jdAnalysis}
            onRestart={handleRestart}
            onScorecardReady={handleScorecardReady}
          />
        )}
      </main>
    </div>
  )
}