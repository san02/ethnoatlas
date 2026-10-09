import { useEffect, useRef } from 'react'

import Map from 'ol/Map'
import View from 'ol/View'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { fromLonLat } from 'ol/proj'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'

import type { Society } from './types'
import variablesData from '../data/variables.json'
import { buildAnswerColors } from './answerColors'

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

type MapProps = {
  societies: Society[]
  selectedVariable: string
  onSelectSociety: (society: Society) => void
}

const variables = variablesData as Variable[]

const normalMissingStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#cccccc' }),
    stroke: new Stroke({
      color: '#666666',
      width: 1,
    }),
  }),
})

const selectedSocietyStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#ffffff' }),
    stroke: new Stroke({
      color: '#222222',
      width: 3,
    }),
  }),
})

function getSocietyStyle(
  answer: string | undefined,
  answerColors: Record<string, string>
) {
  if (!answer || answer === 'Missing data') {
    return normalMissingStyle
  }

  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: answerColors[answer] ?? '#999999',
      }),
      stroke: new Stroke({
        color: '#ffffff',
        width: 1,
      }),
    }),
  })
}

function MapView({
  societies,
  selectedVariable,
  onSelectSociety,
}: MapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const societySourceRef = useRef<VectorSource | null>(null)
  const selectedFeatureRef = useRef<Feature | null>(null)
  const onSelectSocietyRef = useRef(onSelectSociety)

  // Keep the callback current without rebuilding the map.
  useEffect(() => {
    onSelectSocietyRef.current = onSelectSociety
  }, [onSelectSociety])

  // Create the OpenLayers map once.
  useEffect(() => {
    if (!mapElement.current) return

    const societySource = new VectorSource()

    const societyLayer = new VectorLayer({
      source: societySource,
    })

    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        societyLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
    })

    mapRef.current = map
    societySourceRef.current = societySource

    map.on('click', (event) => {
      let clickedFeature: Feature | null = null

      map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          clickedFeature = feature as Feature
          return true
        },
        { hitTolerance: 5 }
      )

      if (!clickedFeature) return

      const feature = clickedFeature as Feature
      const society = feature.get('society') as
        | Society
        | undefined

      if (!society) return

      const previousFeature = selectedFeatureRef.current

      if (previousFeature) {
        previousFeature.setStyle(
          previousFeature.get('normalStyle') as Style
        )
      }

      feature.setStyle(selectedSocietyStyle)
      selectedFeatureRef.current = feature

      onSelectSocietyRef.current(society)
    })

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
      societySourceRef.current = null
      selectedFeatureRef.current = null
    }
  }, [])

  // Update map features and colours when filters or variables change.
  useEffect(() => {
    const source = societySourceRef.current

    if (!source) return

    const variable = variables.find(
      (item) => item.id === selectedVariable
    )

    const answerColors = variable
      ? buildAnswerColors(
          variable.answers,
          variable.type
        )
      : {}

    const features = societies
      .filter(
        (society) =>
          society.lon !== null &&
          society.lat !== null
      )
      .map((society) => {
        const feature = new Feature({
          geometry: new Point(
            fromLonLat([society.lon!, society.lat!])
          ),
        })

        const answer = variable
          ? society.answers[variable.name]
          : undefined

        const normalStyle = getSocietyStyle(
          answer,
          answerColors
        )

        feature.set('society', society)
        feature.set('normalStyle', normalStyle)
        feature.setStyle(normalStyle)

        return feature
      })

    source.clear()
    source.addFeatures(features)

    // Reapply the selected style to the corresponding
    // feature after the data has been refreshed.
    const selectedSocietyId =
      selectedFeatureRef.current
        ?.get('society')
        ?.id

    selectedFeatureRef.current = null

    if (selectedSocietyId) {
      const selectedFeature = features.find(
        (feature) =>
          (feature.get('society') as Society).id ===
          selectedSocietyId
      )

      if (selectedFeature) {
        selectedFeature.setStyle(selectedSocietyStyle)
        selectedFeatureRef.current = selectedFeature
      }
    }
  }, [societies, selectedVariable])

  return (
    <div
      ref={mapElement}
      className="map-container"
      aria-label="Map of societies"
    />
  )
}

export default MapView