import {
  Create,
  CreateButton,
  Datagrid,
  EditButton,
  ExportButton,
  FilterButton,
  List,
  Resource,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TopToolbar
} from "react-admin"
import * as React from "react"
import {FlashAuto} from "@material-ui/icons"
import {ScaffoldSettings, strCapitalizeWords} from "./common"
import {createFieldComponent, createInputComponent, createListFilters} from "./propertyGuesser"
import {EditGuesser} from "./EditGuesser"
import {CreateGuesser} from "./CreateGuesser"


interface ResourceGuesserProps {
  key?: number | string,
  scaffold: ScaffoldSettings,
}

export const guessResource = ({scaffold, key}: ResourceGuesserProps): JSX.Element => {
  const table = scaffold.resourceTable
  const resourceTitle = strCapitalizeWords(table.name)
  const ListActions = () => (
    <TopToolbar>
      <FilterButton/>
      <CreateButton/>
      <ExportButton/>
      {/* Add your custom actions */}
    </TopToolbar>
  )

  const primaryKey = table.columns.find(column => column.pk) || null

  return <Resource
    key={key}
    name={table.name}
    options={{label: resourceTitle}}
    icon={FlashAuto}
    list={
      (props: any) => (
        <List
          {...props}
          title={resourceTitle}
          bulkActionButtons={true}
          sort={primaryKey.pk ? {field: primaryKey.name, order: 'asc'} : null}
          perPage={25}
          filters={createListFilters(scaffold, table)}
          actions={<ListActions/>}
        >
          <Datagrid resource={table.name} optimized>
            {table.columns
              .filter(column => column.type !== "text") // exclude big text from lists
              .slice(0, scaffold.maxGridColumns)
              .map((column, key) => createFieldComponent(scaffold, column, key))}
            <ShowButton basePath={'/' + table.name}/>
            <EditButton basePath={'/' + table.name}/>
          </Datagrid>
        </List>
      )
    }
    show={
      (props: any) => (
        <Show title={resourceTitle} {...props}>
          <SimpleShowLayout>
            {table.columns.map((column, key) => createFieldComponent(scaffold, column, key))}
          </SimpleShowLayout>
        </Show>
      )
    }
    edit={
      (props: any) => (
        <EditGuesser scaffold={scaffold} showCode={true} editProps={props}/>
      )
    }
    create={
      (props: any) => (
        <CreateGuesser scaffold={scaffold} showCode={true} createProps={props}/>
      )
    }
  />
}
