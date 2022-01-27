import * as React from "react"
import str from "underscore.string"
import {DbTable} from "../schema/types"

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
