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

function VariableSelector({
  selectedVariable,
  onSelectVariable,
}: VariableSelectorProps) {
  return (
    <div className="variable-selector">
      <label htmlFor="variable">
        Variable
      </label>

      <select
        id="variable"
        value={selectedVariable}
        onChange={(event) =>
          onSelectVariable(event.target.value)
        }
      >
        <option value="">
          Select a variable
        </option>

        {variables.map((variable) => (
          <option key={variable.id} value={variable.id}>
            {variable.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default VariableSelector