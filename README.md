# ra-admin-guesser-treeql

[PHP-CRUD-API](https://github.com/mevdschee/php-crud-api) Data Provider and automatic UI generator 🪄
for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications on
top of REST/GraphQL services.

[![react-admin-demo](https://marmelab.com/react-admin/img/react-admin-demo-still.png)](https://vimeo.com/268958716)

This package is not just compatible with PHP-CRUD-API, but also with any RESTFul API compatible with
the [TreeQL](https://treeql.org) format.

Optionally, it can also generate the UI for all your tables and columns automatically, similarly
to [`api-platform` admin](https://github.com/api-platform/admin) .

## Motivation

> Data first, code later.

The first reason I was motivated to do this was to quickly prototype an admin tool for a work-in-progress SQL DB schema
that was still uncertain. I didn't want to worry about adapting the UI views whenever the DB schema changed, that would
be a big waste of time until I had the final version of the schema. I also didn't want to invest time on building a
RESTFul API yet.

Possible use cases:

- Having an almost zero-coding quick way to display and manage data in SQL-based databases.
- Building your own simple but highly customizable headless CMS, with e.g. just a SQLite DB file.
- Prototyping admin tools and dashboards without worrying too much about building APIs for them, and without having to
  change the admin UI whenever the DB schema changes (which is very often when it's still being defined).
- Prototyping an internal support tool for your company without worrying too much whenever a microservice changes its
  underlaying DB schema, without waiting for them to create API endpoints (as abstraction layers).

## Installation

```
npm i itsjavi/ra-admin-guesser-treeql
```

## Requirements

- An API based on [php-crud-api](https://github.com/mevdschee/php-crud-api) or compatible. Alternatively,
  any [TreeQL](https://treeql.org) implementation that also exposes a `/columns` endpoint like php-crud-api does. If you
  don't need the scaffolding part, you don't need to have a `/columns` endpoint in the implementation of TreeQL of your
  choice.
- A React or React + NextJS app (with TypeScript) to embed the admin component in

## REST Dialect

This Data Provider supports REST APIs that follow the [TreeQL](https://treeql.org/) dialect, used for instance
in [php-crud-api](https://github.com/mevdschee/php-crud-api) as a reference implementation.

| Method             | API calls                                                                     |
| ------------------ |-------------------------------------------------------------------------------|
| `getList`          | `GET http://my.api.url/posts?sort=title,asc&page=0,25&filter=title,eq,bar`    |
| `getOne`           | `GET http://my.api.url/posts/123`                                             |
| `getMany`          | `GET http://my.api.url/posts?filter=id,in,123,456,789`                        |
| `getManyReference` | `GET http://my.api.url/posts?filter=author_id,eq,345`                         |
| `create`           | `POST http://my.api.url/posts`                                                |
| `update`           | `PUT http://my.api.url/posts/123`                                             |
| `updateMany`       | Single call to `PUT http://my.api.url/posts/1,2,3` with an array payload      |
| `delete`           | `DELETE http://my.api.url/posts/123`                                          |
| `deleteMany`       | Single call to `DELETE http://my.api.url/posts/1,2,3`                         |

## Usage

You can use this package just as a data provider for your React Admin app (`treeqlDataProvider`), or you can also use it
to automatically generate the UI for your tables and columns, using the `AdminGuesser` component. It can also optionally
show you code suggestions.

### Using the data provider without UI scaffolding

```jsx
// in src/App.js
import * as React from "react";
import {Admin, Resource} from 'react-admin';
import {fetchUtils} from "ra-core"
import treeqlDataProvider from 'ra-admin-guesser-treeql';

import {PostList} from './posts';

const App = () => (
  <Admin dataProvider={treeqlDataProvider('http://base.url.to.my.api/', fetchUtils.fetchJson)}>
    <Resource name="posts" list={PostList}/>
  </Admin>
);

export default App;
```

### Embedding the AdminGuesser in a React app

`components/ReactAdmin.tsx`

```tsx
import {MyDashboardPanel} from "./dashboard"
import {AdminGuesser} from "ra-data-treeql"
import {fetchUtils} from "ra-core"

const ReactAdmin = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:1234/api'

  return (
    <AdminGuesser
      baseApiUrl={apiUrl}
      httpClient={fetchUtils.fetchJson}
      // If true, code suggestions for the scaffoled columns will be shown in the UI in a different tab:
      showCode={true}
      // Max number of columns to show in the generated Datagrid:
      maxGridColumns={8}
      // (Optional) Tables that won't be scaffolded:
      excludedTables={[
        "sqlite_sequence",
        "doctrine_migration_versions",
        "migrations"
      ]}
      // (Optional) Allowed list of tables to be scaffolded:
      includedTables={[
        "users",
        "invoices",
        "orders"
      ]}
      // (Optional) Fields to use as labels of the relationship inputs and fields (first found column will be used):
      labelFields={["name", "slug"]}
      // (Optional) Fields to use as searchable fields in the autocomplete relationship inputs (first found column will be used):
      searchableFields={["name", "slug"]}
      // Properties passed to the Admin component
      adminProps={{title: 'React Admin'}}/>
  )
}

export default ReactAdmin
```

### Embedding the AdminGuesser in a NextJS app

`components/ReactAdmin.tsx`

```tsx

import {MyDashboardPanel} from "./dashboard"
import {AdminGuesser} from "ra-data-treeql"
import {fetchUtils} from "ra-core"


const ReactAdmin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1234/api'

  return (
    <AdminGuesser
      baseApiUrl={apiUrl}
      httpClient={fetchUtils.fetchJson}
      showCode={true}
      maxGridColumns={8}
      adminProps={{title: 'React Admin'}}
    />
  )
}

export default ReactAdmin
```

`pages/admin.tsx`

```tsx
import dynamic from "next/dynamic"

/**
 * This page cannot be Server-side rendered, so NextJS has to explicitly declare it as a dynamic page.
 *
 * @see https://marmelab.com/react-admin/CustomApp.html
 * @see https://github.com/marmelab/react-admin/issues/4158
 * @see https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr
 * @see https://stackoverflow.com/questions/65629726/react-admin-with-next-js
 * @see https://stackoverflow.com/questions/55399118/how-to-remove-hash-from-routes-in-react-admin-framework
 */
//
const ReactAdmin = dynamic(() => import("../components/ReactAdmin"), {
  ssr: false,
})

const HomePage = () => <ReactAdmin/>

export default HomePage
```

## Configuring php-crud-api

Just make sure that you enable at least the `records` and `columns` routes.

Example, embedded in a Symfony 5.x controller:

```php
<?php

declare(strict_types=1);

namespace App\Presentation\Http\Controller;

use Nyholm\Psr7\Factory\Psr17Factory;
use Symfony\Bridge\PsrHttpMessage\Factory\HttpFoundationFactory;
use Symfony\Bridge\PsrHttpMessage\Factory\PsrHttpFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Tqdev\PhpCrudApi\Api;
use Tqdev\PhpCrudApi\Config;

class ApiController extends AbstractController
{
    private const OPENAPI_BASE = [
        "info" => [
            "title" => "DB API",
            "version" => "1.0.0",
            "description" => "DB as a RESTFul API",
        ],
        "servers" => [
            [
                "url" => "http://localhost:1234/api",
                "description" => "Localhost",
            ],
        ],
        "schemes" => [
            "http",
        ],
        "x-meta" => ["foo" => "bar"],  // TODO might be useful to generate metadata for your react-admin implementation
    ];

    public function __construct(private readonly string $databaseFile)
    {
    }

    #[Route('/api{params}', name: 'api_route', requirements: ['params' => '.+'])]
    public function index(Request $symfonyRequest): Response
    {
        // Convert the symfonyRequest to a psrRequest
        $psr17Factory = new Psr17Factory();
        $psrHttpFactory = new PsrHttpFactory(
            $psr17Factory, $psr17Factory,
            $psr17Factory, $psr17Factory
        );
        $psrRequest = $psrHttpFactory->createRequest($symfonyRequest);

        // PHP-CRUD-API takes a psrRequest and generates a psrResponse
        $config = new Config(
            [
                'driver' => 'sqlite',
                'address' => $this->databaseFile,
                'controllers' => 'records,columns,openapi,status', // default is 'records,geojson,openapi,status',
                'basePath' => '/api', // Same as the Symfony controller route
                "openApiBase" => json_encode(self::OPENAPI_BASE, JSON_THROW_ON_ERROR),
                'cors.allowHeaders' => ['*'], // You can also white-list them. Left as * for quick prototyping.
            ]
        );
        $api = new Api($config);
        $psrResponse = $api->handle($psrRequest);

        // Convert the psrResponse to a symfonyResponse
        return (new HttpFoundationFactory())->createResponse($psrResponse);
    }
}

```

## TODOs

- [ ] Tests like
  in [ra-data-simple-rest](https://github.com/marmelab/react-admin/blob/master/packages/ra-data-simple-rest/src/index.spec.ts)
- [ ] Basic validation rules (e.g. floats should not be allowed for int columns)
- [ ] Being able to provide own columns json definition // columns resolver fn,
        for TreeQL implementations that don't have this endpoint

## License

This project is licensed under the MIT license.
