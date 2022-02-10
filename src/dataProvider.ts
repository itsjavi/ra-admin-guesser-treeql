import {DataProvider, fetchUtils} from "ra-core"
import {stringify} from "query-string"
import {Inflectors} from "en-inflectors"

const recordsBaseApiPath = '/records'

// TODO: improve filters support
//       https://github.com/mevdschee/php-crud-api/tree/main#filters
//       https://marmelab.com/react-admin/List.html#filter-query-parameter

const normalizeQueryValue = (value: any): string | number => {
  if (Array.isArray(value)) {
    return value.map(normalizeQueryValue).join(',')
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }

  return value
}

const buildFilters = (filters: object | any): string[] => {
  // With this data provider, multiple Filters are only supported as "AND", not as "OR" conditions.
  // @see https://github.com/mevdschee/php-crud-api#multiple-filters
  return Object.entries(filters).map(([key, value]) => {
    let normalizedValue = normalizeQueryValue(value)
    if (key.includes(',')) { // already contains the operator
      return `${key},${normalizedValue}`
    }
    return `${key},eq,${normalizedValue}`
  })
}

const fetchPaginatedList = (
  apiUrl: string,
  httpClient = fetchUtils.fetchJson,
  countHeader: string = 'Content-Range',
  resource: string,
  query: any,
  rangeStart: number,
  rangeEnd: number
) => {

  const url = `${apiUrl}/${resource}?${stringify(query)}`
  const options =
    countHeader === 'Content-Range'
      ? {
        // Chrome doesn't return `Content-Range` header if no `Range` is provided in the request.
        headers: new Headers({
          // Provide 'Range' request header
          'Range': `${resource}=${rangeStart}-${rangeEnd}`,
        }),
      }
      : {}

  return httpClient(url, options).then(({headers, json}) => {
    const records = Array.isArray(json.records) ? json.records : []
    const total = parseInt(json.results)
    return {
      data: records,
      total: total,
    }
  })
}

const normalizeResourceName = (resourceName: string, validResourceNames: string[]): string => {
  if (validResourceNames.includes(resourceName)) {
    return resourceName
  }

  const resourceNameParts = resourceName.split('_')
  const resourceNameLastPart = resourceNameParts.pop()
  const inflector = new Inflectors(resourceNameLastPart)

  if (inflector.isPlural()) {
    // react-admin guessers pluralize foreign key resource names, but your tables might be named in singular
    return resourceNameParts.concat(inflector.toSingular()).join('_')
  }
  console.error(`Invalid API resource name x: ${resourceName}`)
  return resourceName
}

export const treeqlDataProvider = (
  baseApiUrl: string,
  httpClient = fetchUtils.fetchJson,
  validResourceNames: string[],
  countHeader: string = 'Content-Range'
): DataProvider => {
  const apiUrl = `${baseApiUrl}${recordsBaseApiPath}`
  const fetchOne = (resource, params) => {
    const validResource = normalizeResourceName(resource, validResourceNames)
    return httpClient(`${apiUrl}/${validResource}/${params.id}`).then(({json}) => ({
      data: json,
    }))
  }

  return {
    getList: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      const {page, perPage} = params.pagination
      const {field, order} = params.sort
      const rangeStart = (page - 1) * perPage
      const rangeEnd = page * perPage - 1
      const query = {
        order: `${field},${order}`,
        page: `${page},${perPage}`,
        range: `${rangeStart},${rangeEnd}`,
        filter: !params.filter ? null : buildFilters(params.filter)
      }
      return fetchPaginatedList(
        apiUrl, httpClient, countHeader, validResource, query, rangeStart, rangeEnd)
    },
    getOne: fetchOne,
    getMany: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      const query = {
        filter: `id,in,${params.ids.join(',')}`,
      }
      const url = `${apiUrl}/${validResource}?${stringify(query)}`
      return httpClient(url)
        .then(({json}) => ({data: json.records, total: json.results || json.records.length}))
        .then(({data, total}) => {
          return {
            data, total
          }
        })
    },

    getManyReference: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      const {page, perPage} = params.pagination
      const {field, order} = params.sort
      const rangeStart = (page - 1) * perPage
      const rangeEnd = page * perPage - 1
      const query = {
        order: `${field},${order}`,
        page: `${page},${perPage}`,
        range: `${rangeStart},${rangeEnd}`,
        filter: buildFilters({
          ...params.filter,
          [params.target]: params.id,
        }),
      }
      return fetchPaginatedList(apiUrl, httpClient, countHeader, validResource, query, rangeStart, rangeEnd)
    },

    update: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      return httpClient(`${apiUrl}/${validResource}/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      }).then(({json}) => ({data: {id: params.id, ...json}}))
    },


    updateMany: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      return httpClient(`${apiUrl}/${validResource}/${params.ids.join(',')}`, {
        method: 'PUT',
        body: JSON.stringify(
          // https://marmelab.com/react-admin/DataProviders.html#updatemany
          // in updateMany, the same payload (partial) is applied to all the records
          params.ids.map(() => params.data)
        ),
      })
        // OK: API returns a list of IDs, which is actually what RA expects
        .then(({json}) => ({data: json}))
    },

    create: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      return httpClient(`${apiUrl}/${validResource}`, {
        method: 'POST',
        body: JSON.stringify(params.data),
      })
        // WARNING (create): the API returns the new Primary Key value, but RA expects a record
        .then((res) => (res.body))
        .then((primaryKeyValue) => {
          return fetchOne(validResource, {id: primaryKeyValue})
        })
    },

    delete: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      return httpClient(`${apiUrl}/${validResource}/${params.id}`, {
        method: 'DELETE',
        headers: new Headers({
          'Content-Type': 'text/plain',
        }),
      })
        // WARNING (delete): the API returns num of deleted rows, but RA expects a record
        .then(() => {
          return {data: params.previousData as any}
        })
    },

    deleteMany: (resource, params) => {
      const validResource = normalizeResourceName(resource, validResourceNames)
      return httpClient(`${apiUrl}/${validResource}/${params.ids.join(',')}`, {
        method: 'DELETE',
        headers: new Headers({
          'Content-Type': 'text/plain',
        }),
      }).then(({json}) => {
        // WARNING (deleteMany): The API returns num of deleted rows for every deleted item,
        // but RA expects an array of the IDs. We need to do a check.
        if (params.ids.length !== json.length) {
          throw new Error(`deleteMany: expected ${params.ids.length} deleted rows, got ${json.length}`)
        }
        return {data: params.ids}
      })
    },
  }
}
