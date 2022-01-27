import {
  AutocompleteInput,
  BooleanField,
  BooleanInput,
  Create,
  CreateButton,
  Datagrid,
  DateField,
  DateTimeInput, DeleteButton,
  Edit,
  EditButton,
  ExportButton,
  FilterButton,
  List, ListButton,
  NumberField,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  Resource, SaveButton,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput, Toolbar,
  TopToolbar
} from "react-admin"
import * as React from "react"
import str from "underscore.string"
import {FlashAuto} from "@material-ui/icons"
import {DbColumn, DbTable} from "../hooks/useColumns"

const labelFields = ["label", "name", "title", "slug"] // TODO make these AdminGuesser props
const textSearchFields = ["label", "name", "title", "slug", "description", "summary", "text"]

const humanizeWords = (value: string) => {
  const parts = str.humanize(value).split(' ')
  for (let i = 0; i < parts.length; i++) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1)
  }
  return parts.join(' ')
}

const createFieldComponent = (tables: DbTable[], column: DbColumn, key?: number): JSX.Element => {
  if (!!column.fk) {
    const elem = createReferenceField(tables, column, key)
    if (elem !== null) {
      return elem
    }
  }

  const fieldProps = {
    label: humanizeWords(column.name),
    source: column.name,
    key: key
  }
  switch (column.type) {
    case "int":
    case "float":
      const numberFormatOptions: Intl.NumberFormatOptions = {useGrouping: false} // TODO: expose as guesser prop
      return <NumberField {...fieldProps} options={numberFormatOptions}/>
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

const findFkLabelColumns = (tables: DbTable[], column: DbColumn, fieldsSet: string[] = labelFields): DbColumn[] => {
  // find fk table
  const fkTable = tables.find(t => t.name === column.fk)
  if (!fkTable) {
    console.warn(`Could not find table for column ${column.name}`, column)
    return null
  }

  // find pk column
  const pkColumn = fkTable.columns.find(c => c.pk)
  if (!pkColumn) {
    console.warn(`Could not find primary key for table ${fkTable.name}`, fkTable)
    return null
  }

  // find label column
  let labelColumns = fkTable.columns.filter(c => fieldsSet.includes(c.name))

  if (labelColumns.length === 0) {
    return [pkColumn]
  }

  return labelColumns
}

const createReferenceField = (tables: DbTable[], column: DbColumn, key?: number): JSX.Element => {
  const labelColumns = findFkLabelColumns(tables, column)
  return <ReferenceField source={column.name} reference={column.fk} key={key}>
    {createFieldComponent(tables, labelColumns[0])}
  </ReferenceField>
}

const createReferenceInput = (tables: DbTable[], column: DbColumn, key?: number): JSX.Element => {
  const labelColumn = findFkLabelColumns(tables, column, labelFields)[0]
  const searchableColumn = findFkLabelColumns(tables, column, textSearchFields)[0]
  const filterQuery = searchableColumn.name + ',cs' // contains string

  return <ReferenceInput
    source={column.name}
    reference={column.fk}
    key={key}
    perPage={50}
    resettable={column.nullable ? true : undefined}
    filterToQuery={searchText => {
      const q = {[filterQuery]: searchText}
      console.log('filterToQuery', q)
      return q
    }}
  >
    <AutocompleteInput
      required={!column.nullable}
      optionText={labelColumn.name}
    />
  </ReferenceInput>
}

const createInputComponent = (tables: DbTable[], column: DbColumn, key?: number): JSX.Element => {
  if (!!column.fk) {
    const elem = createReferenceInput(tables, column, key)
    if (elem !== null) {
      return elem
    }
  }

  const fieldProps = {
    source: column.name,
    required: !column.nullable,
    key: key,
    disabled: column.pk,
    resettable: column.nullable ? null : undefined
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
  tables: DbTable[],
  table: DbTable,
  maxGridColumns: number
}

const buildListFilters = (table: DbTable): JSX.Element[] => {
  let firstFilter: DbColumn = null

  return table.columns
    .filter(column => (!column.pk && textSearchFields.includes(column.name)))
    .map((column, index) => {
      const isAlwaysOn = index === 0
      if (isAlwaysOn) {
        firstFilter = column
      }
      return <TextInput
        key={index}
        label={humanizeWords(column.name)}
        source={column.name + ",cs"}
        alwaysOn={isAlwaysOn}
        resettable
        defaultValue={isAlwaysOn ? undefined : ""}
      />
    })
    .concat(
      table.columns
        .filter(column => (!column.pk && column.type === "bool"))
        .map((column, index) => {
          const isAlwaysOn = firstFilter === null && index === 0
          return <BooleanInput
            key={index}
            label={humanizeWords(column.name)}
            source={column.name + ",eq"}
            alwaysOn={isAlwaysOn}
            resettable
            defaultValue={isAlwaysOn ? undefined : true}
          />
        })
    )
}

export const guessResource = ({tables, table, maxGridColumns, key}: ResourceGuesserProps): JSX.Element => {
  const resourceTitle = humanizeWords(table.name)
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
          filters={buildListFilters(table)}
          actions={<ListActions/>}
        >
          <Datagrid resource={table.name} optimized>
            {table.columns
              .filter(column => column.type !== "text") // exclude big text from lists
              .slice(0, maxGridColumns)
              .map((column, key) => createFieldComponent(tables, column, key))}
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
            {table.columns.map((column, key) => createFieldComponent(tables, column, key))}
          </SimpleShowLayout>
        </Show>
      )
    }
    edit={
      (props: any) => (
        <Edit title={"Edit " + resourceTitle} {...props}>
          <SimpleForm toolbar={<Toolbar>
            <SaveButton />
            <ListButton />
            <DeleteButton undoable={false} />
          </Toolbar>}>
            {table.columns.map((column, key) => createInputComponent(tables, column, key))}
          </SimpleForm>
        </Edit>
      )
    }
    create={
      (props: any) => (
        <Create title={"Create " + resourceTitle} {...props}>
          <SimpleForm>
            {table.columns
              .filter((column) => column.pk !== true)
              .map((column, key) => createInputComponent(tables, column, key))
            }
          </SimpleForm>
        </Create>
      )
    }
  />
}
