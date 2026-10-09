import variablesData from '../data/variables.json'

type Variable = {
  id: string
  name: string
  category: string
  type: string
}

type VariableSelectorProps = {
  selectedVariable: string
  onSelectVariable: (variableId: string) => void
}

const variables = variablesData as Variable[]

const categories = [
  ...new Set(variables.map((variable) => variable.category)),
]

function VariableSelector({
  selectedVariable,
  onSelectVariable,
}: VariableSelectorProps) {
  return (
    <div className="variable-selector">
      <label htmlFor="variable">Variable</label>

      <select
        id="variable"
        value={selectedVariable}
        onChange={(event) =>
          onSelectVariable(event.target.value)
        }
      >
        <option value="">Select a variable</option>

        {categories.map((category) => (
          <optgroup key={category} label={category}>
            {variables
              .filter(
                (variable) => variable.category === category
              )
              .map((variable) => (
                <option
                  key={variable.id}
                  value={variable.id}
                >
                  {variable.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

export default VariableSelector