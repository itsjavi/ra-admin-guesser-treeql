import {
  BooleanField,
  BooleanInput,
  Create,
  CreateButton,
  Datagrid,
  DateField,
  DateTimeInput,
  Edit,
  EditButton,
  ExportButton,
  FilterButton,
  List,
  NumberField,
  NumberInput,
  Resource,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar
} from "react-admin"
import * as React from "react"
import str from "underscore.string"
import {FlashAuto} from "@material-ui/icons"
import {DbColumn, DbTable} from "../hooks/useColumns"

const createFieldComponent = (column: DbColumn, key?: number): JSX.Element => {
  const fieldProps = {
    label: str.humanize(column.name),
    source: column.name,
    key: key
  }
  switch (column.type) {
    case "int":
    case "float":
      return <NumberField {...fieldProps} />
    case "bool":
      return <BooleanField {...fieldProps} />
    case "datetime":
      return <DateField {...fieldProps}/>
    case "text":
      return <TextField {...fieldProps}/>
    default:
      return <TextField {...fieldProps}/>
  }
}

const createInputComponent = (column: DbColumn, key?: number): JSX.Element => {
  const fieldProps = {
    source: column.name,
    required: !column.nullable,
    key: key,
    disabled: column.pk,
    resettable: column.nullable
  }
  switch (column.type) {
    case "int":
    case "float":
      return <NumberInput {...fieldProps} />
    case "bool":
      return <BooleanInput {...fieldProps} />
    case "datetime":
      return <DateTimeInput {...fieldProps} />
    case "text":
      return <TextInput multiline {...fieldProps}/>
    default:
      return <TextInput {...fieldProps} />
  }
}

interface ResourceGuesserProps {
  key: number | string,
  table: DbTable,
  maxGridColumns: number
}

export const guessResource = ({table, maxGridColumns, key}: ResourceGuesserProps): JSX.Element => {
  const resourceTitle = str.humanize(table.name)
  const ListActions = () => (
    <TopToolbar>
      <FilterButton/>
      <CreateButton/>
      <ExportButton/>
      {/* Add your custom actions */}
    </TopToolbar>
  )

  const listFilters = table.columns
    .filter(column => ["name", "title", "slug"].includes(column.name))
    .map((column, key) => (
      <TextInput
        key={key}
        label={"Search by " + str.humanize(column.name)}
        source={column.name + ",cs"}
        alwaysOn={key === 0}
        resettable
        defaultValue={""}
      />
    ))

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
          filters={listFilters}
          actions={<ListActions/>}
        >
          <Datagrid resource={table.name} optimized>
            {table.columns
              .filter(column => column.type !== "text") // exclude big text from lists
              .slice(0, maxGridColumns)
              .map((column, key) => createFieldComponent(column, key))}
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
            {table.columns.map((column, key) => createFieldComponent(column, key))}
          </SimpleShowLayout>
        </Show>
      )
    }
    edit={
      (props: any) => (
        <Edit title={"Edit " + resourceTitle} {...props}>
          <SimpleForm>
            {table.columns.map((column, key) => createInputComponent(column, key))}
          </SimpleForm>
        </Edit>
      )
    }
    create={
      (props: any) => (
        <Create title={"Create " + resourceTitle} {...props}>
          <SimpleForm>
            {table.columns.map((column, key) => createInputComponent(column, key))}
          </SimpleForm>
        </Create>
      )
    }
  />
}
