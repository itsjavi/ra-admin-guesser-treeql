import {useEffect, useState} from "react"
import {fetchUtils} from "ra-core"
import {DbColumnType, DbTable} from "./types"

const columnsBaseApiPath = '/columns'

const normalizeColumnType = (rawColumnType: string): DbColumnType => {
  switch (rawColumnType) {
    case "int":
    case "integer":
    case "tinyint":
    case "smallint":
    case "mediumint":
    case "bigint":
    case "int2":
    case "int8":
      return 'int'
    case "decimal":
    case "float":
    case "real":
    case "double":
    case "number":
    case "numeric":
      return 'float'
    case "boolean":
    case "bool":
      return 'bool'
    case "date":
    case "datetime":
    case "time":
    case "timestamp":
      return 'datetime'
    case "text":
    case "clob":
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
export const useSchema = (
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
                // @ts-ignore
                column.nullable = column.nullable === true || column.nullable === "true"
                // @ts-ignore
                column.pk = column.pk === true || column.pk === "true"
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
