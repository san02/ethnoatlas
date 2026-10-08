
import type { Society } from './types'
import variablesData from '../data/variables.json'

type Variable = {
  id: string
  name: string
  answers: {
    id: string
    name: string
    ord: number | null
  }[]
}

const variables = variablesData as Variable[]

type SocietyPanelProps = {
  society: Society | null
}

function SocietyPanel({ society }: SocietyPanelProps) {
  if (!society) {
    return (
      <section className="society-panel">
        <h2>Society</h2>
        <p>Select a society from the map.</p>
      </section>
    )
  }

  return (
    <section className="society-panel">
      <h2>{society.name}</h2>

      {society.alternativeNames.length > 0 && (
        <>
          <h3>Other names</h3>
          <ul>
            {society.alternativeNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </>
      )}

      <p>Region: {society.region ?? 'Unknown'}</p>
      <p>Year: {society.year ?? 'Unknown'}</p>

      <h3>Recorded answers</h3>
      <ul>
        {variables.map((variable) => {
          const answer = society.answers[variable.name]

          if (!answer) return null

          return (
            <li key={variable.id}>
              <strong>{variable.name}:</strong> {answer}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default SocietyPanel
