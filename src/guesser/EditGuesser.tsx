import {EditContextProvider, useEditController} from "ra-core"
import {EditProps} from "ra-ui-materialui/lib/types"
import {Edit, FormTab, TabbedForm} from "react-admin"
import {BaseGuesserProps, CodeContainer, createInputsFromDbTable, strCapitalizeWords, useReactCode} from "./common"
import React from 'react'
import str from "underscore.string"

export type EditGuesserProps = BaseGuesserProps & { editProps: EditProps | any }

export const EditGuesser = (props: EditGuesserProps) => {
  const controllerProps = useEditController(props.editProps)
  const guesserTitle = props.editProps.title || "Edit " + strCapitalizeWords(props.scaffold.resourceTable?.name || '')
  const componentPrefix = str.capitalize(str.camelize(props.scaffold.resourceTable?.name || ''))
  const guessedCodeTemplate = `// Guessed Edit:
//    Example filterToQuery function = {searchText => ({'name,cs': searchText})}

export const ${componentPrefix}Edit = (props: EditProps) => (
    <Edit title={"${guesserTitle}"} {...props}>
        <SimpleForm redirect={"show"}>
%s
        </SimpleForm>
    </Edit>
);`

  if (!props.scaffold.resourceTable) {
    throw new Error("scaffold.resourceTable is not defined for EditGuesser")
  }

  const guessedInputs = createInputsFromDbTable(props.scaffold, props.scaffold.resourceTable)
  const guessedInputsCode = useReactCode(guessedInputs, guessedCodeTemplate, 10)

  return (
    <EditContextProvider value={controllerProps}>
      <Edit title={guesserTitle} {...props.editProps}>
        <TabbedForm redirect={"show"}>
          <FormTab label={"Data"}>
            {guessedInputs}
          </FormTab>
          {props.showCode && <FormTab label={"Code"}><CodeContainer>{guessedInputsCode}</CodeContainer></FormTab>}
          {props.children && props.children}
        </TabbedForm>
      </Edit>
    </EditContextProvider>
  )
}
