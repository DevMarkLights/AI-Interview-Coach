import styles from './mode_selector.module.css'

const MODES = [
  {
    id: 'behavioral',
    label: 'Behavioral',
    icon: '◈',
    description: 'STAR-format questions around collaboration, conflict, and decision-making.',
    tags: ['Cross-team', 'Leadership', 'Communication'],
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: '⟨/⟩',
    description: 'Concept and applied questions targeting your specific tech stack.',
    tags: ['Algorithms', 'Frameworks', 'Problem Solving'],
  },
  {
    id: 'system_design',
    label: 'System Design',
    icon: '⬡',
    description: 'Architecture questions scaled to the role\'s domain and seniority.',
    tags: ['Scalability', 'Trade-offs', 'Architecture'],
  },
  {
    id: 'role_specific',
    label: 'Role Specific',
    icon: '◎',
    description: 'Deep domain questions only an expert in this field could answer well.',
    tags: ['Domain', 'Expertise', 'Depth'],
  },
]

export default function ModeSelector({ selectedModes, setSelectedModes, questions, onConfirm, mobile }) {
  function toggleMode(id) {
    if (selectedModes.includes(id)) {
      if (selectedModes.length === 1) return // keep at least one
      setSelectedModes(selectedModes.filter(m => m !== id))
    } else {
      setSelectedModes([...selectedModes, id])
    }
  }

  const questionCount = questions.filter(q => selectedModes.includes(q.mode)).length

  return (
    <>
    {mobile ?
      <div className={styles.container} style={{padding: '10px'}}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            step 02
          </div>
          <h2 className={styles.title}>Choose your<br /><span className={styles.titleAccent}>interview modes.</span></h2>
          <p className={styles.subtitle}>
            Select the categories you want to practice. All modes are active by default —
            deselect any you want to skip.
          </p>
        </div>

        <div className={styles.grid}>
          {MODES.map(mode => {
            const isSelected = selectedModes.includes(mode.id)
            const modeQuestionCount = questions.filter(q => q.mode === mode.id).length

            return (
              <button
                key={mode.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => toggleMode(mode.id)}
                style={{padding:'5px'}}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}>{mode.icon}</span>
                  <div className={styles.cardCheck}>
                    {isSelected ? <span className={styles.checkFilled}>✓</span> : <span className={styles.checkEmpty} />}
                  </div>
                </div>

                <div className={styles.cardLabel}>{mode.label}</div>
                <div className={styles.cardDesc}>{mode.description}</div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardTags}>
                    {mode.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  {modeQuestionCount > 0 && (
                    <span className={styles.qCount}>
                      {modeQuestionCount}Q
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span className={styles.footerCount}>
              <span className={styles.footerCountNum}>{questionCount}</span> questions selected
            </span>
            <span className={styles.footerModes}>
              {selectedModes.length} of {MODES.length} modes active
            </span>
          </div>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={selectedModes.length === 0}
          >
            Start Interview
            <span className={styles.confirmArrow}>→</span>
          </button>
        </div>
      </div>
    :
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            step 02
          </div>
          <h2 className={styles.title}>Choose your<br /><span className={styles.titleAccent}>interview modes.</span></h2>
          <p className={styles.subtitle}>
            Select the categories you want to practice. All modes are active by default —
            deselect any you want to skip.
          </p>
        </div>

        <div className={styles.grid}>
          {MODES.map(mode => {
            const isSelected = selectedModes.includes(mode.id)
            const modeQuestionCount = questions.filter(q => q.mode === mode.id).length

            return (
              <button
                key={mode.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => toggleMode(mode.id)}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}>{mode.icon}</span>
                  <div className={styles.cardCheck}>
                    {isSelected ? <span className={styles.checkFilled}>✓</span> : <span className={styles.checkEmpty} />}
                  </div>
                </div>

                <div className={styles.cardLabel}>{mode.label}</div>
                <div className={styles.cardDesc}>{mode.description}</div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardTags}>
                    {mode.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  {modeQuestionCount > 0 && (
                    <span className={styles.qCount}>
                      {modeQuestionCount}Q
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span className={styles.footerCount}>
              <span className={styles.footerCountNum}>{questionCount}</span> questions selected
            </span>
            <span className={styles.footerModes}>
              {selectedModes.length} of {MODES.length} modes active
            </span>
          </div>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={selectedModes.length === 0}
          >
            Start Interview
            <span className={styles.confirmArrow}>→</span>
          </button>
        </div>
      </div>
    }
    </>
  )
}