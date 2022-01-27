import * as React from "react"
import {ElementType, useEffect, useState} from "react"
import str from "underscore.string"
import {DbTable} from "../schema/types"
import {createFieldComponent, createInputComponent} from "./propertyGuesser"
import reactElementToJSXString from "react-element-to-jsx-string"
import {Card} from "@material-ui/core"
import {FormTab, SimpleForm, SimpleShowLayout, Tab, TabbedForm, TabbedShowLayout} from "react-admin"

export type ScaffoldSettings = {
  tables: DbTable[]
  resourceTable?: DbTable
  searchableFields?: string[]
  labelFields?: string[]
  maxGridColumns: number
  excludedTables?: string[]
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

export const GuessedView = (props: GuessedDetailProps) => {
  const {elements, elementsCode, showCode, ...formProps} = props
  if (!showCode) {
    return <SimpleShowLayout {...formProps}>
      {elements}
    </SimpleShowLayout>
  }
  return <TabbedShowLayout {...formProps}>
    <Tab label={"Data"}>
      {elements}
    </Tab>
    {showCode && <Tab label={"Code"}><CodeContainer>{elementsCode}</CodeContainer></Tab>}
  </TabbedShowLayout>
}
