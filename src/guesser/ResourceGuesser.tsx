import {Create, CreateButton, Edit, ExportButton, FilterButton, List, Resource, Show, TopToolbar} from "react-admin"
import * as React from "react"
import {FlashAuto} from "@material-ui/icons"
import {createListFilters, ScaffoldSettings, strCapitalizeWords} from "./common"
import {CreateFormGuesser} from "./CreateFormGuesser"
import {EditFormGuesser} from "./EditFormGuesser"
import {ShowGuesser} from "./ShowGuesser"
import {DatagridGuesser} from "./DatagridGuesser"

interface ResourceGuesserProps {
  key?: number | string,
  scaffold: ScaffoldSettings,
}

export const guessResource = ({scaffold, key}: ResourceGuesserProps): JSX.Element => {
  const table = scaffold.resourceTable
  const resourceTitle = strCapitalizeWords(table.name)
  const ListActions = () => (
    <TopToolbar>
      <FilterButton/>
      <CreateButton/>
      <ExportButton/>
      {/* Add your custom actions */}
    </TopToolbar>
  )

  const primaryKey = table.columns.find(column => column.pk) || null

  return <Resource
    key={key}
    name={table.name}
    options={{label: resourceTitle}}
    icon={FlashAuto}
    list={
      (props: any) => (
        <List
          {...props}
          title={resourceTitle}
          bulkActionButtons={true}
          sort={primaryKey.pk ? {field: primaryKey.name, order: 'asc'} : null}
          perPage={25}
          filters={createListFilters(scaffold, table)}
          actions={<ListActions/>}
        >
          <DatagridGuesser scaffold={scaffold}/>
        </List>
      )
    }
    show={
      (props: any) => (
        <Show title={resourceTitle} {...props}>
          <ShowGuesser scaffold={scaffold}/>
        </Show>
      )
    }
    edit={
      (props: any) => (
        <Edit title={resourceTitle} {...props}>
          <EditFormGuesser scaffold={scaffold}/>
        </Edit>
      )
    }
    create={
      (props: any) => (
        <Create title={resourceTitle} {...props}>
          <CreateFormGuesser scaffold={scaffold}/>
        </Create>
      )
    }
  />
}
