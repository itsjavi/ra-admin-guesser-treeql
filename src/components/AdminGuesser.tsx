import {Admin, Error, Loading} from "react-admin"
import * as React from "react"
import {AdminProps, fetchUtils} from "ra-core"
import {createHashHistory as createHistory} from "history"
import {useColumns} from "../hooks/useColumns"
import {treeqlDataProvider} from "../dataProvider"
import {guessResource} from "./RecordGuesser"

interface ResourceGuesserProps {
  baseApiUrl: string,
  httpClient: (typeof fetchUtils.fetchJson),
  excludedTables?: string[],
  adminProps: AdminProps | any,
  maxGridColumns: number
  children?: React.ReactNode
}

const getSafeAdminChildren = (children: any): React.ReactElement | React.ReactElement[] => {
  // CoreAdminRouter needs all children to be defined elements, because they are traversed
  // in order to check their props and clone them with React.cloneElement

  if (!React.isValidElement(children) || children === null) {
    return <div className={"ra-core-admin-router--empty-child"} style={{"display": "none"}}/>
  }

  return children
}

export const AdminGuesser = (
  {
    baseApiUrl,
    httpClient = fetchUtils.fetchJson,
    adminProps,
    maxGridColumns,
    excludedTables = ["sqlite_sequence", "doctrine_migration_versions", "migrations"],
    children
  }: ResourceGuesserProps
) => {
  const {tables, loading, error} = useColumns(baseApiUrl, httpClient, excludedTables)

  if (loading) return <Loading
    loadingPrimary={`Generating ${adminProps.title || 'React Admin'} UI...`}
    loadingSecondary={"Scaffolding tables and columns..."}
  />
  if (error) return <Error error={error}/>
  if (!tables || tables.length === 0) return <div>No tables found.</div>

  return <Admin
    {...adminProps}
    history={createHistory({basename: '/'})}
    dataProvider={treeqlDataProvider(baseApiUrl, fetchUtils.fetchJson, tables.map(table => table.name))}
  >
    {tables.map(
      (table, index) => guessResource({tables, table, maxGridColumns, key: index})
    )}
    {getSafeAdminChildren(children)}
  </Admin>
}
