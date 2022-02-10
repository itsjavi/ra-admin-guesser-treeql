import * as React from "react"
import {ElementType, useEffect, useState} from "react"
import str from "underscore.string"
import {DbColumn, DbTable} from "../schema/types"
import reactElementToJSXString from "react-element-to-jsx-string"
import {Card} from "@material-ui/core"
import {
  AutocompleteInput,
  BooleanField,
  BooleanInput,
  DateField,
  DateTimeInput,
  FormTab,
  NumberField,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  SimpleForm,
  TabbedForm,
  TextField,
  TextInput
} from "react-admin"

export type ScaffoldSettings = {
  tables: DbTable[]
  resourceTable?: DbTable
  searchableFields?: string[]
  labelFields?: string[]
  maxGridColumns: number
  showCode: boolean
}

export type BaseGuesserProps = {
  children?: ElementType
  scaffold: ScaffoldSettings // TODO use context + provider to avoid passing it around
}

export const safeChildren = (children: any): React.ReactElement | React.ReactElement[] => {
  // CoreAdminRouter needs all direct children to be defined elements, because they are traversed
  // in order to check their props and clone them with React.cloneElement

  if (!React.isValidElement(children) || children === null) {
    return <div style={{"display": "none"}}/>
  }

  return children
}

export const strCapitalizeWords = (value: string) => {
  const parts = str.humanize(value).split(' ')
  for (let i = 0; i < parts.length; i++) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1)
  }
  return parts.join(' ')
}

export const indentString = (str, count, indent = ' ') => str.replace(/^/gm, indent.repeat(count))

export const createInputsFromDbTable = (scaffold: ScaffoldSettings, table: DbTable, skipPk = false): JSX.Element[] => {
  const columns = table.columns.filter(column => !skipPk || (skipPk && column.pk !== true))
  return columns.map((column, index) => createInputComponent(scaffold, column, index))
}

export const createFieldsFromDbTable = (scaffold: ScaffoldSettings, table: DbTable, skipPk = false): JSX.Element[] => {
  const columns = table.columns.filter(column => !skipPk || (skipPk && column.pk !== true))
  return columns.map((column, index) => createFieldComponent(scaffold, column, index))
}

export const getReactElementCode = (elements: React.ReactElement | React.ReactElement[]) => {
  let code = ''
  if (Array.isArray(elements)) {
    code = elements.map(child => reactElementToJSXString(child)).join("\n\n")
  } else {
    code = reactElementToJSXString(elements) + "\n"
  }
  return code
    .replace(/function noRefCheck\(\) \{\}/g, "/* your function */")
    .replace(/\=\{undefined\}/g, "")
}

export const useReactCode = (
  element: React.ReactElement | React.ReactElement[],
  template: string = '%s',
  indent: number = 10
) => {
  const [reactCode, setReactCode] = useState<string>("")
  useEffect(() => {
    if (!reactCode) {
      setReactCode(
        template.replace('%s', indentString(getReactElementCode(element), indent))
      )
    }
  }, [reactCode, element, template, indent])
  return reactCode
}

export const CodeContainer = ({children}: { children: string }) => {
  const codeStyle = {
    fontFamily: '"Fira Code", "Fira Mono", monospace',
    fontSize: '0.9rem',
    padding: '.5rem 1rem',
    // overflow: 'auto',
    // maxHeight: '400px',
    backgroundColor: '#2B2B2B',
    color: '#FFC45A'
  }
  return <Card>
    <pre style={codeStyle}>
      <code style={{color: 'inherit', backgroundColor: 'rgba(0,0,0,0.24)'}}>
        {children}
      </code>
    </pre>
  </Card>
}

export type GuessedDetailProps = {
  elements: React.ReactElement[]
  elementsCode: string
  showCode: boolean
}

export const GuessedForm = (props: GuessedDetailProps) => {
  const {elements, elementsCode, showCode, ...formProps} = props

  if (!showCode) {
    return <SimpleForm {...formProps} redirect={"show"}>
      {elements}
    </SimpleForm>
  }
  return <TabbedForm {...formProps} redirect={"show"}>
    <FormTab label={"Data"}>
      {elements}
    </FormTab>
    {showCode && <FormTab label={"Code"}><CodeContainer>{elementsCode}</CodeContainer></FormTab>}
  </TabbedForm>
}

// -------------------------------------------------------------------------
// Property Guesser

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
      //return <DateField emptyText={"--"} {...fieldProps}/> // react-admin uses Date.toLocaleString, which messes up the date
      return <TextField emptyText={"--"} {...fieldProps}/>
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
      // return <DateTimeInput {...fieldProps}/> // react-admin uses Date.toLocaleString, which messes up the date
      return <TextInput {...fieldProps} />
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
