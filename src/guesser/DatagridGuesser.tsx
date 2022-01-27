import {BaseGuesserProps, CodeContainer, strCapitalizeWords, useReactCode} from "./common"
import str from "underscore.string"
import React from "react"
import {createFieldComponent} from "./propertyGuesser"
import {Datagrid, EditButton, ShowButton, Tab, TabbedShowLayout} from "react-admin"

export const DatagridGuesser = (props: BaseGuesserProps) => {
  const {scaffold, ...gridProps} = props
  const resource = scaffold.resourceTable?.name || ''
  const guesserTitle = "Create " + strCapitalizeWords(resource)
  const componentPrefix = str.capitalize(str.camelize(resource))

  // TODO generate code for filters // filters={createListFilters(scaffold, table)}

  const guessedCodeTemplate = `// Guessed List component for resource '${resource}'
//    example filterToQuery function: {searchText => ({'name,cs': searchText})}

export const ${componentPrefix}List = (props) => (
    <List
      title={"${guesserTitle}"}
      {...props}
      bulkActionButtons={true}
      sort={{field: 'id', order: 'asc'}}
      perPage={25}
    >
        <Datagrid resource={"${resource}"} optimized>
%s
            <ShowButton basePath={'/${resource}'}/>
            <EditButton basePath={'/${resource}'}/>
        </Datagrid>
    </List>
);`

  if (!scaffold.resourceTable) {
    throw new Error("scaffold.resourceTable is not defined for DatagridGuesser")
  }

  const guessedFields = scaffold.resourceTable.columns
    .filter(column => column.type !== "text") // exclude big text from lists
    .slice(0, scaffold.maxGridColumns)
    .map((column, key) => createFieldComponent(scaffold, column, key))
  const guessedInputsCode = useReactCode(guessedFields, guessedCodeTemplate, 12)

  const grid = <Datagrid resource={scaffold.resourceTable.name} optimized {...gridProps}>
    {guessedFields}
    <ShowButton basePath={'/' + scaffold.resourceTable.name}/>
    <EditButton basePath={'/' + scaffold.resourceTable.name}/>
  </Datagrid>

  const codeContainer = <CodeContainer>{guessedInputsCode}</CodeContainer>

  if (scaffold.showCode) {
    console.log(codeContainer)
    // TODO: find a better layout for this
    return (
      <>
        <div>
          {grid}
        </div>
        <br />
        <div>
          {codeContainer}
        </div>
      </>
    )
  }

  return grid
}
