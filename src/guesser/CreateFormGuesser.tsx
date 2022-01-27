import {CreateProps} from "react-admin"
import {BaseGuesserProps, createInputsFromDbTable, GuessedForm, strCapitalizeWords, useReactCode} from "./common"
import React from 'react'
import str from "underscore.string"
import {FormWithRedirectProps} from "ra-core"

export const CreateFormGuesser = (props: BaseGuesserProps | FormWithRedirectProps) => {
  const {scaffold, ...formProps} = props
  const resource = scaffold.resourceTable?.name || ''
  const guesserTitle = "Create " + strCapitalizeWords(resource)
  const componentPrefix = str.capitalize(str.camelize(resource))
  const guessedCodeTemplate = `// Guessed Create component for resource '${resource}'
//    example filterToQuery function: {searchText => ({'name,cs': searchText})}

export const ${componentPrefix}Create = (props: CreateProps) => (
    <Create title={"${guesserTitle}"} {...props}>
        <SimpleForm redirect={"show"}>
%s
        </SimpleForm>
    </Create>
);`

  if (!scaffold.resourceTable) {
    throw new Error("scaffold.resourceTable is not defined for CreateGuesser")
  }

  const guessedInputs = createInputsFromDbTable(scaffold, scaffold.resourceTable, true)
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
