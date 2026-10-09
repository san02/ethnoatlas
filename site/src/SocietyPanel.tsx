import type { Society } from './types'
import variablesData from '../data/variables.json'

type Variable = {
  id: string
  name: string
}

type SocietyPanelProps = {
  society: Society | null
}

const variables = variablesData as Variable[]

function SocietyPanel({ society }: SocietyPanelProps) {
  if (!society) {
    return (
      <aside className="society-panel">
        <h2>Society details</h2>
        <p>Select a society on the map to explore its recorded data.</p>
      </aside>
    )
  }

  return (
    <aside className="society-panel">
      <h2>{society.name}</h2>

      {society.alternativeNames.length > 0 && (
        <section className="society-details">
          <h3>Alternative names</h3>
          <ul>
            {society.alternativeNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="society-details">
        <h3>Location and source</h3>
        <p>
          <strong>Region:</strong> {society.region ?? 'Unknown'}
        </p>
        <p>
          <strong>Year:</strong> {society.year ?? 'Unknown'}
        </p>
      </section>

      <section className="society-details">
        <h3>Recorded answers</h3>

        {Object.keys(society.answers).length === 0 ? (
          <p>No recorded answers available.</p>
        ) : (
          <dl className="answer-list">
            {variables.map((variable) => {
              const answer = society.answers[variable.name]

              if (answer === undefined || answer === '') {
                return null
              }

              return (
                <div
                  className="answer-entry"
                  key={variable.id}
                >
                  <dt>{variable.name}</dt>
                  <dd>{answer}</dd>
                </div>
              )
            })}
          </dl>
        )}
      </section>
    </aside>
  )
}

export default SocietyPanel