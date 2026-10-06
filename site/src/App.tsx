import './App.css'
import MapView from './Map'
import societiesData from '../data/societies.json'
import type { Society } from './types'
import { useState, useEffect } from 'react'
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
  
  const [selectedRegion, setSelectedRegion] =
    useState('')
  
  const [selectedAnswer, setSelectedAnswer] = useState('')

  useEffect(() => {
    setSelectedSociety(null)
  }, [selectedRegion])

  useEffect(() => {
    setSelectedAnswer('')
  }, [selectedVariable])

  const regions = [
    ...new Set(
      societies
        .map((society) => society.region)
        .filter((region): region is string => region !== null)
    ),
  ].sort()

  const selectedVariableInfo = variables.find(
    (variable) => variable.id === selectedVariable
  )

  const filteredSocieties = societies.filter((society) => {
    const matchesRegion =
      !selectedRegion ||
      society.region === selectedRegion

    const matchesAnswer =
      !selectedAnswer ||
      society.answers[selectedVariableInfo?.name ?? ''] ===
        selectedAnswer

    return matchesRegion && matchesAnswer
  })



  const availableAnswers = selectedVariableInfo
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

  const legendAnswers = selectedVariableInfo
    ? [
        ...new Set(
          filteredSocieties
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
    ? filteredSocieties.filter(
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
        <div className="region-selector">
          <label htmlFor="region">
            Region
          </label>

          <select
            id="region"
            value={selectedRegion}
            onChange={(event) =>
              setSelectedRegion(event.target.value)
            }
          >
            <option value="">All regions</option>

            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        <div className="answer-selector">
          <label htmlFor="answer">
            Answer
          </label>

          <select
            id="answer"
            value={selectedAnswer}
            onChange={(event) =>
              setSelectedAnswer(event.target.value)
            }
            disabled={!selectedVariableInfo}
          >
            <option value="">
              All answers
            </option>

            {availableAnswers.map((answer) => (
              <option key={answer} value={answer}>
                {answer}
              </option>
            ))}
          </select>
        </div>
      </section>

      <main className="main">
        <section className="map">
          <MapView
            societies={filteredSocieties}
            selectedVariable={selectedVariable}
            onSelectSociety={setSelectedSociety}
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
                {filteredSocieties.length} societies shown
                {selectedVariableInfo &&
                  ` · ${coverageCount} have data`}
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