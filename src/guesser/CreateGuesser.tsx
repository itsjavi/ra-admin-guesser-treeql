import {CreateContextProvider, useCreateController} from "ra-core"
import {CreateProps, FormTab, TabbedForm} from "react-admin"
import {BaseGuesserProps, CodeContainer, createInputsFromDbTable, strCapitalizeWords, useReactCode} from "./common"
import React from 'react'
import str from "underscore.string"
import {Create} from "@material-ui/icons"

export type CreateGuesserProps = BaseGuesserProps & { createProps: CreateProps | any }

export const CreateGuesser = (props: CreateGuesserProps) => {
  const controllerProps = useCreateController(props.createProps)
  const guesserTitle = props.createProps.title || "Create " + strCapitalizeWords(props.scaffold.resourceTable?.name || '')
  const componentPrefix = str.capitalize(str.camelize(props.scaffold.resourceTable?.name || ''))
  const guessedCodeTemplate = `// Guessed Create:
//    Example filterToQuery function = {searchText => ({'name,cs': searchText})}
export const ${componentPrefix}Create = (props: CreateProps) => (
    <Create title={"${guesserTitle}"} {...props}>
        <SimpleForm redirect={"show"}>
%s
        </SimpleForm>
    </Create>
);`

  if (!props.scaffold.resourceTable) {
    throw new Error("scaffold.resourceTable is not defined for CreateGuesser")
  }

  const guessedInputs = createInputsFromDbTable(props.scaffold, props.scaffold.resourceTable, true)
  const guessedInputsCode = useReactCode(guessedInputs, guessedCodeTemplate, 10)

  return (
    <CreateContextProvider value={controllerProps}>
        <TabbedForm redirect={"show"}>
          <FormTab label={"Datas"}>
            {guessedInputs}
          </FormTab>
          {props.showCode && <FormTab label={"Code"}><CodeContainer>{guessedInputsCode}</CodeContainer></FormTab>}
          {props.children && props.children}
        </TabbedForm>
    </CreateContextProvider>
  )
}
