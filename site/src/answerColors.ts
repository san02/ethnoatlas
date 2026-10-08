const categoricalPalette = [
  '#e63946',
  '#457b9d',
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#9b5de5',
  '#00b4d8',
  '#6a994e',
  '#f72585',
  '#577590',
  '#bc6c25',
  '#4361ee',
]

const ordinalPalette = [
  '#deebf7',
  '#9ecae1',
  '#6baed6',
  '#3182bd',
  '#08519c',
]

type Answer = {
  name: string
  ord: number | null
}

export function buildAnswerColors(
  answers: Answer[],
  type: string
) {
  const colors: Record<string, string> = {}

  const usableAnswers = answers.filter(
    (answer) => answer.name !== 'Missing data'
  )

  if (type === 'Ordinal') {
    const orderedAnswers = [...usableAnswers].sort(
      (a, b) => (a.ord ?? 0) - (b.ord ?? 0)
    )

    orderedAnswers.forEach((answer, index) => {
      colors[answer.name] =
        ordinalPalette[index % ordinalPalette.length]
    })

    return colors
  }

  const sortedAnswers = [...usableAnswers].sort(
    (a, b) => a.name.localeCompare(b.name)
  )

  sortedAnswers.forEach((answer, index) => {
    colors[answer.name] =
      categoricalPalette[index % categoricalPalette.length]
  })

  return colors
}