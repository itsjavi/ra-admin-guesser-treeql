import {EditContextProvider, useEditController} from "ra-core"
import * as React from "react"
import {EditProps} from "ra-ui-materialui/lib/types"
import {Edit, FormTab, TabbedForm} from "react-admin"
import {BaseGuesserProps, strCapitalizeWords} from "./common"
import {createInputComponent} from "./propertyGuesser"

export type EditGuesserProps = EditProps & BaseGuesserProps

export const EditGuesser = (props: EditGuesserProps) => {
  const resourceTitle = strCapitalizeWords(props.scaffold.resourceTable?.name || '')
  const controllerProps = useEditController(props)
  return (
    <EditContextProvider value={controllerProps}>
      <Edit title={props.title || "Edit " + resourceTitle} {...props}>
        <TabbedForm>
          <FormTab label={"Data"}>
            {
              props.scaffold.resourceTable?.columns
                .map((column, index) => createInputComponent(props.scaffold, column, index))
            }
          </FormTab>
        </TabbedForm>
      </Edit>
    </EditContextProvider>
  )
}
