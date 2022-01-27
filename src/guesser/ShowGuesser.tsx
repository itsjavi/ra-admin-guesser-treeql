import {BaseGuesserProps, createFieldsFromDbTable, GuessedForm, strCapitalizeWords, useReactCode} from "./common"
import str from "underscore.string"
import React from "react"

export const ShowGuesser = (props: BaseGuesserProps) => {
  const {scaffold, ...formProps} = props
  const resource = scaffold.resourceTable?.name || ''
  const guesserTitle = "Show " + strCapitalizeWords(resource)
  const componentPrefix = str.capitalize(str.camelize(resource))
  const guessedCodeTemplate = `// Guessed Show component for resource '${resource}'
//    example filterToQuery function: {searchText => ({'name,cs': searchText})}

export const ${componentPrefix}Show = (props: ShowProps) => (
    <Show title={"${guesserTitle}"} {...props}>
        <SimpleShowLayout redirect={"show"}>
%s
        </SimpleShowLayout>
    </Show>
);`

  if (!scaffold.resourceTable) {
    throw new Error("scaffold.resourceTable is not defined for ShowGuesser")
  }

  const guessedFields = createFieldsFromDbTable(scaffold, scaffold.resourceTable)
  const guessedFieldsCode = useReactCode(guessedFields, guessedCodeTemplate, 10)

  return (
    <GuessedForm
      showCode={scaffold.showCode}
      elements={guessedFields}
      elementsCode={guessedFieldsCode}
      {...formProps}
    />
  )
}
