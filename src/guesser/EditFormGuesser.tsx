import {EditProps} from "ra-ui-materialui/lib/types"
import {BaseGuesserProps, createInputsFromDbTable, GuessedForm, strCapitalizeWords, useReactCode} from "./common"
import React from 'react'
import str from "underscore.string"

export const EditFormGuesser = (props: BaseGuesserProps) => {
  const {scaffold, ...formProps} = props
  const resource = scaffold.resourceTable?.name || ''
  const guesserTitle = "Edit " + strCapitalizeWords(resource)
  const componentPrefix = str.capitalize(str.camelize(resource))
  const guessedCodeTemplate = `// Guessed Edit component for resource '${resource}'
//    example filterToQuery function: {searchText => ({'name,cs': searchText})}

export const ${componentPrefix}Edit = (props: EditProps) => (
    <Edit title={"${guesserTitle}"} {...props}>
        <SimpleForm redirect={"show"}>
%s
        </SimpleForm>
    </Edit>
);`

  if (!scaffold.resourceTable) {
    throw new Error("scaffold.resourceTable is not defined for EditGuesser")
  }

  const guessedInputs = createInputsFromDbTable(scaffold, scaffold.resourceTable)
  const guessedInputsCode = useReactCode(guessedInputs, guessedCodeTemplate, 10)

  return (
    <GuessedForm
      showCode={scaffold.showCode}
      elements={guessedInputs}
      elementsCode={guessedInputsCode}
      {...formProps}
    />
  )
}
