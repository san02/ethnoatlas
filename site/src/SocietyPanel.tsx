import type { Society } from './types'

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

      <p>Region: {society.region}</p>
      <p>Year: {society.year}</p>

      <h3>Answers</h3>

      <ul>
        {Object.entries(society.answers).map(
          ([variable, answer]) => (
            <li key={variable}>
              <strong>{variable}:</strong> {answer}
            </li>
          )
        )}
      </ul>
    </section>
  )
}

export default SocietyPanel