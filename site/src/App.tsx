import './App.css'
import MapView from './Map'
import societiesData from '../data/societies.json'
import type { Society } from './types'
import { useState } from 'react'
import SocietyPanel from './SocietyPanel'
import VariableSelector from './VariableSelector'
import { buildAnswerColors } from './answerColors'
import variablesData from '../data/variables.json'

const societies = societiesData as Society[]

type Variable = {
  id: string
  name: string
}

const variables = variablesData as Variable[]


function App() {

  const [selectedSociety, setSelectedSociety] =
    useState<Society | null>(null)

  const [selectedVariable, setSelectedVariable] =
    useState('')

  const selectedVariableInfo = variables.find(
    (variable) => variable.id === selectedVariable
  )

  const legendAnswers = selectedVariableInfo
    ? [
        ...new Set(
          societies
            .map(
              (society) =>
                society.answers[selectedVariableInfo.name]
            )
            .filter(Boolean)
        ),
      ].sort()
    : []

  const answerColors = buildAnswerColors(legendAnswers)

  const coverageCount = selectedVariableInfo
    ? societies.filter(
        (society) =>
          society.answers[selectedVariableInfo.name]
      ).length
    : 0
  

  return (
    <div className="app">
      <header className="header">
        <h1>EthnoAtlas</h1>
      </header>

      <section className="controls">
        <VariableSelector
          selectedVariable={selectedVariable}
          onSelectVariable={setSelectedVariable}
        />
      </section>

      <main className="main">
        <section className="map">
          <MapView
            societies={societies}
            onSelectSociety={setSelectedSociety}
            selectedVariable={selectedVariable}
          />

          {selectedVariableInfo && (
            <div className="legend">
              <h3>{selectedVariableInfo.name}</h3>

              {legendAnswers.map((answer) => (
                <div className="legend-item" key={answer}>
                  <span
                    className="legend-dot"
                    style={{
                      backgroundColor: answerColors[answer],
                    }}
                  />

                  <span>{answer}</span>
                </div>
              ))}

              <div className="legend-item">
                <span
                  className="legend-dot missing"
                />

                <span>No data</span>
              </div>

              <p className="coverage">
                {coverageCount} of {societies.length} societies
                have data
              </p>
            </div>
          )}
        </section>

        <SocietyPanel society={selectedSociety} />
      </main>
    </div>
  )
}

export default App