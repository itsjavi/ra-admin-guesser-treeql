import {DbColumn, DbTable} from "../schema/types"
import {ScaffoldSettings, strCapitalizeWords} from "./common"
import {
  AutocompleteInput,
  BooleanField,
  BooleanInput,
  DateField,
  DateTimeInput,
  NumberField,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  TextField,
  TextInput
} from "react-admin"
import * as React from "react"

export const createReferenceField = (scaffold: ScaffoldSettings, column: DbColumn, key?: number): JSX.Element => {
  const labelColumns = findFkLabelColumns(scaffold, column, scaffold.labelFields)
  return <ReferenceField source={column.name} reference={column.fk} key={key} emptyText={"--"}>
    {createFieldComponent(scaffold, labelColumns[0])}
  </ReferenceField>
}

export const createReferenceInput = (scaffold: ScaffoldSettings, column: DbColumn, key?: number): JSX.Element => {
  const labelColumn = findFkLabelColumns(scaffold, column, scaffold.labelFields)[0]
  const searchableColumn = findFkLabelColumns(scaffold, column, scaffold.searchableFields)[0]
  const filterQuery = searchableColumn.name + ',cs' // contains string

  return <ReferenceInput
    source={column.name}
    reference={column.fk}
    key={key}
    perPage={50}
    resettable={column.nullable ? true : undefined}
    filterToQuery={searchText => ({[filterQuery]: searchText})}
  >
    <AutocompleteInput
      required={!column.nullable}
      optionText={labelColumn.name}
    />
  </ReferenceInput>
}

export const createFieldComponent = (scaffold: ScaffoldSettings, column: DbColumn, key?: number): JSX.Element => {
  if (!!column.fk) {
    const elem = createReferenceField(scaffold, column, key)
    if (elem !== null) {
      return elem
    }
  }

  const fieldProps = {
    label: strCapitalizeWords(column.name),
    source: column.name,
    key: key
  }
  switch (column.type) {
    case "int":
    case "float":
      const numberFormatOptions: Intl.NumberFormatOptions = {useGrouping: false} // TODO: expose as guesser prop
      return <NumberField emptyText={"--"} {...fieldProps} options={numberFormatOptions}/>
    case "bool":
      return <BooleanField emptyText={"--"} {...fieldProps}/>
    case "datetime":
      return <DateField emptyText={"--"} {...fieldProps}/>
    case "text":
      return <TextField emptyText={"--"} {...fieldProps}/>
    default:
      return <TextField emptyText={"--"} {...fieldProps}/>
  }
}

export const findFkLabelColumns = (scaffold: ScaffoldSettings, column: DbColumn, fieldsSet: string[]): DbColumn[] => {
  // find fk table
  const fkTable = scaffold.tables.find(t => t.name === column.fk)
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
  let labelColumns = fieldsSet.map(f => fkTable.columns.find(c => c.name === f)).filter(c => !!c)

  if (labelColumns.length === 0) {
    return [pkColumn]
  }

  return labelColumns
}

export const createInputComponent = (scaffold: ScaffoldSettings, column: DbColumn, key?: number): JSX.Element => {
  if (!!column.fk) {
    const elem = createReferenceInput(scaffold, column, key)
    if (elem !== null) {
      return elem
    }
  }

  const fieldProps = {
    source: column.name,
    required: !column.nullable,
    key: key,
    disabled: column.pk,
    resettable: column.nullable ? true : undefined
  }
  switch (column.type) {
    case "int":
    case "float":
      return <NumberInput {...fieldProps}/>
    case "bool":
      return <BooleanInput {...fieldProps}/>
    case "datetime":
      return <DateTimeInput {...fieldProps}/>
    case "text":
      return <TextInput multiline {...fieldProps}/>
    default:
      return <TextInput {...fieldProps} />
  }
}

export const createListFilters = (scaffold: ScaffoldSettings, table: DbTable): JSX.Element[] => {
  let firstFilter: DbColumn = null

  return table.columns
    .filter(column => (!column.pk && scaffold.searchableFields.includes(column.name)))
    .map((column, index) => {
      const isAlwaysOn = index === 0
      if (isAlwaysOn) {
        firstFilter = column
      }
      return <TextInput
        key={index}
        label={strCapitalizeWords(column.name)}
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
            label={strCapitalizeWords(column.name)}
            source={column.name + ",eq"}
            alwaysOn={isAlwaysOn}
            resettable
            defaultValue={isAlwaysOn ? undefined : true}
          />
        })
    )
}
