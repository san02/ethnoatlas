const palette = [
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

export function buildAnswerColors(answers: string[]) {
  const uniqueAnswers = [...new Set(answers)].sort()
  const colors: Record<string, string> = {}

  uniqueAnswers.forEach((answer, index) => {
    colors[answer] = palette[index % palette.length]
  })

  return colors
}