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
  type: string
  answers: {
    id: string
    name: string
    ord: number | null
  }[]
}

const variables = variablesData as Variable[]


function App() {

  const params = new URLSearchParams(window.location.search)

  const [selectedSociety, setSelectedSociety] =
    useState<Society | null>(null)

  const [selectedVariable, setSelectedVariable] =
    useState(params.get('variable') ?? '')

  const [selectedRegion, setSelectedRegion] =
    useState(params.get('region') ?? '')

  const [selectedAnswer, setSelectedAnswer] =
    useState(params.get('answer') ?? '')

  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedVariable) {
      params.set('variable', selectedVariable)
    }

    if (selectedRegion) {
      params.set('region', selectedRegion)
    }

    if (selectedAnswer) {
      params.set('answer', selectedAnswer)
    }

    const query = params.toString()
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname

    window.history.replaceState({}, '', newUrl)
  }, [
    selectedVariable,
    selectedRegion,
    selectedAnswer,
  ])

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

  const societyAnswer =
    society.answers[selectedVariableInfo?.name ?? '']

  const matchesAnswer =
    !selectedAnswer ||
    (selectedAnswer === 'Missing data'
      ? societyAnswer === 'Missing data'
      : societyAnswer === selectedAnswer)

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
            .filter(
              (answer): answer is string =>
                Boolean(answer) && answer !== 'Missing data'
            )
        ),
      ].sort()
    : []

  const legendAnswers = selectedVariableInfo
    ? [...selectedVariableInfo.answers]
        .filter((answer) => answer.name !== 'Missing data')
        .sort((a, b) => {
          if (selectedVariableInfo.type === 'Ordinal') {
            return (a.ord ?? 0) - (b.ord ?? 0)
          }

          return a.name.localeCompare(b.name)
        })
        .map((answer) => answer.name)
    : []

  const answerColors = buildAnswerColors(
    selectedVariableInfo?.answers ?? [],
    selectedVariableInfo?.type ?? 'Categorical'
  )

  const coverageCount = selectedVariableInfo
    ? filteredSocieties.filter((society) => {
        const answer =
          society.answers[selectedVariableInfo.name]

        return Boolean(answer) && answer !== 'Missing data'
      }).length
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

            <option value="Missing data">
              Missing data
            </option>
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

                <span>Missing data</span>
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