import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import type { Society } from './types'
import variablesData from '../data/variables.json'
import { buildAnswerColors } from './answerColors'


type MapProps = {
  societies: Society[]
  selectedVariable: string
  onSelectSociety: (society: Society) => void
}

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


const selectedSocietyStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({
      color: '#ffffff',
    }),
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
    return new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#cccccc',
        }),
        stroke: new Stroke({
          color: '#666666',
          width: 1,
        }),
      }),
    })
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

function MapView({ societies, onSelectSociety, selectedVariable }: MapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null)
  const selectedFeature = useRef<Feature | null>(null)

  useEffect(() => {
    if (!mapElement.current) {
      return
    }

    const variable = variables.find(
        (variable) => variable.id === selectedVariable
    )

    const answerColors = variable
    ? buildAnswerColors(variable.answers, variable.type)
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

        feature.set('society', society)

        const answer = variable
            ? society.answers[variable.name]
            : undefined

        const normalStyle = getSocietyStyle(
            answer,
            answerColors
        )

        feature.setStyle(normalStyle)
        feature.set('normalStyle', normalStyle)

        return feature
    })

    const societyLayer = new VectorLayer({
        source: new VectorSource({
            features,
        }),
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

    map.on('click', (event) => {
        map.forEachFeatureAtPixel(
            event.pixel,
            (feature) => {
                const society = feature.get('society') as Society

                // Reset previous selection
                if (selectedFeature.current) {
                    const normalStyle =
                        selectedFeature.current.get('normalStyle')

                    selectedFeature.current.setStyle(normalStyle)
                }

                // Highlight new selection and Remember it
                const selected = feature as Feature
                selected.setStyle(selectedSocietyStyle)
                selectedFeature.current = selected

                // Tell React about the selection
                onSelectSociety(society)
            },
            {
                hitTolerance: 5,
            },
        )
    })
    return () => {
      map.setTarget(undefined)
    }
  }, [societies, selectedVariable, onSelectSociety])

//   return <div ref={mapElement} className="map" />
  return <div ref={mapElement} className="map-container" />
}

export default MapView