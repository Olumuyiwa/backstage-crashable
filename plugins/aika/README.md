# AIKA for Backstage

AIKA is an internal engineering assistant implemented as a Backstage frontend plugin and backend plugin. The frontend sends questions to the AIKA backend; the backend calls the OpenAI Responses API and can look up matching entities in the Backstage Software Catalog. The Catalog remains the source of truth for entity information.

```text
Backstage page -> AIKA backend -> OpenAI Responses API
  -> CatalogClient tool lookup
```

## Workspace layout

```text
plugins/
|-- aika/                         # Frontend page, API client, PageBlueprint
`-- aika-backend/                 # HTTP routes and OpenAI/Catalog service
```

The workspace package names are `@internal/backstage-plugin-aika` and `@internal/backstage-plugin-aika-backend`. Use these exact names in imports and backend registration.

## Frontend integration

This app uses Backstage's modern frontend system (`createApp` and `features`). AIKA is implemented with `PageBlueprint` in `plugins/aika/src/plugin.tsx`:

```tsx
export const aikaRouteRef = createRouteRef();

export const aikaPageExtension = PageBlueprint.make({
  params: {
    path: '/aika',
    title: 'AIKA',
    icon: <AndroidIcon fontSize="inherit" />,
    routeRef: aikaRouteRef,
    loader: async () => {
      const { AikaPage } = await import('./components/AikaPage/AikaPage');
      return <AikaPage />;
    },
  },
});

export const aikaPlugin = createFrontendPlugin({
  pluginId: 'aika',
  extensions: [aikaPageExtension],
});
```

The page's `title` and `icon` provide its navigation entry. `packages/app/src/App.tsx` imports and includes the plugin in the features list:

```tsx
import { aikaPlugin } from '@internal/backstage-plugin-aika';

export default createApp({
  features: [
    // Other app features...
    aikaPlugin,
  ],
});
```

Do not add a React `<Route>` or `createNavItemExtension` for this setup. The older tutorial examples use APIs that are not available in this app's installed Backstage version.

The API client in `plugins/aika/src/api/AikaApi.ts` uses Backstage `discoveryApi` and `fetchApi`, so the browser calls the discovered AIKA backend rather than OpenAI directly.

## Backend and Catalog tool

`packages/backend/src/index.ts` registers the backend workspace plugin:

```ts
backend.add(import('@internal/backstage-plugin-aika-backend'));
```

The plugin in `plugins/aika-backend/src/plugin.ts` reads the `aika` config, creates a `CatalogClient` and `AikaService`, and mounts the router. The router exposes:

- `GET /api/aika/health` for a basic health response.
- `POST /api/aika/ask` for authenticated questions, with JSON body `{ "question": "Who owns payments-api?" }`.

The service uses the OpenAI Responses API with a `find_catalog_entity` function tool. When the model requests the tool, AIKA queries the Catalog and returns entity fields such as name, description, owner, lifecycle, type, and system to the model for its answer.

## Configuration and local run

The active app config needs the model and API key setting. The repository currently has this under `aika` in `app-config.yaml` and `app-config.local.yaml`:

```yaml
aika:
  model: gpt-5
  openaiApiKey: ${POC_OPENAI_API_KEY}
```

The YAML references an environment variable; it does not contain the key. From the repository root, set the key in the same terminal used to start Backstage, then start the app:

```zsh
export POC_OPENAI_API_KEY='your-OpenAI-API-key'
yarn start
```

Open [http://localhost:3000/aika](http://localhost:3000/aika). The API key stays in the backend environment; never put it in frontend code or commit its value.

Check that the backend is running with:

```sh
curl http://localhost:7007/api/aika/health
```

## Cloud Run deployment

The deploy workflow maps the GitHub Actions secret `POC_OPENAI_API_KEY` to the Cloud Run environment variable of the same name. Add that repository or environment secret in GitHub Actions settings before deploying. The deploy command uses `--set-env-vars`, so include every required runtime variable there when changing the list.

## Troubleshooting

- `AIKA request failed: 500` is the frontend's status message. The backend logs the underlying exception as `AIKA request failed`; check the backend terminal locally or Cloud Run logs after deployment.
- Confirm `POC_OPENAI_API_KEY` is set in the backend process environment and that the key can use the configured model. Do not share the key in logs or chat.
- The `/ask` route requires Backstage authentication. The health route is configured to allow unauthenticated requests.

## Verification status

The Aika frontend plugin build and app frontend build completed successfully after the frontend-system migration. The latest full `yarn tsc` check still reports three errors in the separate `plugins/aika-backend` workspace: an unused `auth` dependency, a `todoList` test option not accepted by `RouterOptions`, and an `unknown` value assigned to `JsonValue`. The app bundle builds, but the complete workspace type-check is not yet clean.
