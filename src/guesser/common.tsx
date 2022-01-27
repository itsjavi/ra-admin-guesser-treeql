import * as React from "react"
import {useEffect, useState} from "react"
import str from "underscore.string"
import {DbTable} from "../schema/types"
import {createInputComponent} from "./propertyGuesser"
import reactElementToJSXString from "react-element-to-jsx-string"
import {Card} from "@material-ui/core"

export type ScaffoldSettings = {
  tables: DbTable[]
  resourceTable?: DbTable
  searchableFields?: string[]
  labelFields?: string[]
  maxGridColumns: number
  excludedTables?: string[]
}

export type BaseGuesserProps = {
  children?: React.ReactElement
  scaffold: ScaffoldSettings
  showCode?: boolean
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
      <code style={{color: 'inherit',  backgroundColor: 'rgba(0,0,0,0.24)'}}>
        {children}
      </code>
    </pre>
  </Card>
}
