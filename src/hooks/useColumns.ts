import {useEffect, useState} from "react"
import {fetchUtils} from "ra-core"

const columnsBaseApiPath = '/columns'

// data structures for the "GET /columns" endpoint from php-crud-api
export type DbColumnType = "int" | "float" | "bool" | "varchar" | "text" | "blob" | "datetime"
export type DbColumn = {
  name: string
  type: DbColumnType
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  pk: boolean
  fk: string
}
export type DbTable = {
  name: string
  type: "table" | "view" | "system_view" | "system_table" | "trigger" | "index" | "sequence" | "unknown"
  columns: DbColumn[]
}

const normalizeColumnType = (rawColumnType: string): DbColumnType => {
  switch (rawColumnType) {
    case "int":
    case "integer":
    case "smallint":
    case "bigint":
      return 'int'
    case "decimal":
    case "float":
    case "double":
    case "number":
      return 'float'
    case "boolean":
    case "bool":
    case "tinyint":
      return 'bool'
    case "date":
    case "datetime":
    case "time":
    case "timestamp":
      return 'datetime'
    case "text":
    case "tinytext":
    case "mediumtext":
    case "longtext":
      return 'text'
    case "blob":
    case "tinyblob":
    case "mediumblob":
    case "longblob":
      return 'blob'
    default:
      return 'varchar'
  }
}

/**
 *
 * @param baseApiUrl
 * @param httpClient
 * @param excluded List of excluded table names
 */
export const useColumns = (
  baseApiUrl: string,
  httpClient = fetchUtils.fetchJson,
  excluded: string[] = []
) => {
  const [_tables, setTables] = useState<DbTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()

  useEffect(() => {
    (async () => {
      await httpClient(baseApiUrl + columnsBaseApiPath)
        .then(({json}) => json as { tables: DbTable[] })
        .then(({tables}) => {
          return tables
            .filter(
              table => (table.type === "table" && !excluded.includes(table.name))
            )
            .map(table => {
              table.columns.forEach(column => {
                column.type = normalizeColumnType(column.type)
              })
              return table
            })
        })
        .then(tables => {
          setLoading(false)
          setTables(tables)
          return tables
        })
        .catch(error => {
          setError(error)
          setLoading(false)
        })
    })()
  }, [baseApiUrl, httpClient, excluded, setTables, setLoading, setError])

  return {
    loading,
    error,
    tables: _tables,
  }
}
