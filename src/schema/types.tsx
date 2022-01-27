// data structures for the "GET /columns" endpoint from php-crud-api

export type DbColumnMap = Map<string, DbColumn>

export type DbColumnType = "int" | "float" | "bool" | "varchar" | "text" | "blob" | "datetime"

export type DbColumn = {
  name: string
  type: DbColumnType
  length?: number
  precision?: number
  scale?: number
  nullable?: boolean
  pk?: boolean
  // Foreign Key table name
  fk?: string
}

export type DbTable = {
  name: string
  type: "table" | "view" | "system_view" | "system_table" | "trigger" | "index" | "sequence" | "unknown"
  columns: DbColumn[]
}
