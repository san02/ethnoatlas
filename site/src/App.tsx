import { useEffect, useState } from 'react'
import './App.css'

import MapView from './Map'
import SocietyPanel from './SocietyPanel'
import VariableSelector from './VariableSelector'
import { buildAnswerColors } from './answerColors'

import societiesData from '../data/societies.json'
import variablesData from '../data/variables.json'

import type { Society } from './types'

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

type Filters = {
  variable: string
  region: string
  answer: string
}

function getFiltersFromUrl(search: string): Filters {
  const params = new URLSearchParams(search)

  const requestedVariable = params.get('variable') ?? ''
  const requestedRegion = params.get('region') ?? ''
  const requestedAnswer = params.get('answer') ?? ''

  const variableInfo = variables.find(
    (variable) => variable.id === requestedVariable
  )

  const variable = variableInfo ? requestedVariable : ''

  const regionExists = societies.some(
    (society) => society.region === requestedRegion
  )

  const region = regionExists ? requestedRegion : ''

  const answerExists =
    variableInfo &&
    requestedAnswer &&
    societies.some((society) => {
      const matchesRegion =
        !region || society.region === region

      const societyAnswer =
        society.answers[variableInfo.name]

      return (
        matchesRegion &&
        societyAnswer === requestedAnswer
      )
    })

  return {
    variable,
    region,
    answer: answerExists ? requestedAnswer : '',
  }
}

function App() {
  const [initialFilters] = useState(() =>
    getFiltersFromUrl(window.location.search)
  )

  const [selectedSociety, setSelectedSociety] =
    useState<Society | null>(null)

  const [selectedVariable, setSelectedVariable] =
    useState(initialFilters.variable)

  const [selectedRegion, setSelectedRegion] =
    useState(initialFilters.region)

  const [selectedAnswer, setSelectedAnswer] =
    useState(initialFilters.answer)

  const selectedVariableInfo = variables.find(
    (variable) => variable.id === selectedVariable
  )

  // Keep the URL synchronized with the selected filters.
  // Avoid creating duplicate history entries when navigating
  // with the browser Back and Forward buttons.
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

    const currentUrl =
      window.location.pathname + window.location.search

    if (newUrl !== currentUrl) {
      window.history.pushState({}, '', newUrl)
    }
  }, [
    selectedVariable,
    selectedRegion,
    selectedAnswer,
  ])

  // Restore filters when the browser navigates through history.
  useEffect(() => {
    const handlePopState = () => {
      const filters = getFiltersFromUrl(
        window.location.search
      )

      setSelectedVariable(filters.variable)
      setSelectedRegion(filters.region)
      setSelectedAnswer(filters.answer)
      setSelectedSociety(null)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const regions = [
    ...new Set(
      societies
        .map((society) => society.region)
        .filter(
          (region): region is string => region !== null
        )
    ),
  ].sort()

  // Apply the region and answer filters.
  const filteredSocieties = societies.filter((society) => {
    const matchesRegion =
      !selectedRegion ||
      society.region === selectedRegion

    const societyAnswer = selectedVariableInfo
      ? society.answers[selectedVariableInfo.name]
      : undefined

    const matchesAnswer =
      !selectedAnswer ||
      (selectedAnswer === 'Missing data'
        ? !societyAnswer ||
          societyAnswer === 'Missing data'
        : societyAnswer === selectedAnswer)

    return matchesRegion && matchesAnswer
  })

  // Show answers available in the selected region.
  const availableAnswers = selectedVariableInfo
    ? [
        ...new Set(
          societies
            .filter(
              (society) =>
                !selectedRegion ||
                society.region === selectedRegion
            )
            .map(
              (society) =>
                society.answers[selectedVariableInfo.name]
            )
            .filter(
              (answer): answer is string =>
                Boolean(answer) &&
                answer !== 'Missing data'
            )
        ),
      ].sort()
    : []

  // Sort ordinal answers by their order.
  // Sort categorical answers alphabetically.
  const legendAnswers = selectedVariableInfo
    ? [...selectedVariableInfo.answers]
        .filter(
          (answer) => answer.name !== 'Missing data'
        )
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

        return (
          Boolean(answer) &&
          answer !== 'Missing data'
        )
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
          onSelectVariable={(variableId) => {
            setSelectedVariable(variableId)
            setSelectedAnswer('')
            setSelectedSociety(null)
          }}
        />

        <div className="region-selector">
          <label htmlFor="region">Region</label>

          <select
            id="region"
            value={selectedRegion}
            onChange={(event) => {
              setSelectedRegion(event.target.value)
              setSelectedAnswer('')
              setSelectedSociety(null)
            }}
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
          <label htmlFor="answer">Answer</label>

          <select
            id="answer"
            value={selectedAnswer}
            onChange={(event) =>
              setSelectedAnswer(event.target.value)
            }
            disabled={!selectedVariableInfo}
          >
            <option value="">All answers</option>

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
                <div
                  className="legend-item"
                  key={answer}
                >
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
                <span className="legend-dot missing" />
                <span>Missing data</span>
              </div>

              <p className="coverage">
                {filteredSocieties.length} societies shown
                {' · '}
                {coverageCount} have data
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