# Core Components Catalog Data

`core-components` stores catalog descriptors and scaffolder templates grouped by deployment environment. The directories are data organization only: Backstage loads a directory's files only when an app config registers a file location or a registered `Location` entity points to them.

## Current layout

```text
core-components/
|-- local/
|   |-- entities.yaml                 # Example components, systems, and APIs
|   |-- org.yaml                      # POC and guests groups; links group/user manifests
|   |-- groups.yaml                   # Location listing the local group descriptors
|   |-- users.yaml                    # Location listing the local user descriptors
|   |-- templates/
|   |   |-- template-locations.yaml  # Location listing local scaffolder templates
|   |   |-- new-java-project/
|   |   `-- new-nodejs-project/
|   `-- users-and-groups/
|       |-- groups/                   # devex, products, payments, edutech, sre
|       `-- users/                    # guest, Olumuyiwa, pipelinesofcode
|-- production/
|   |-- entities.yaml
|   |-- org.yaml                      # Production user/group descriptors
|   |-- users.yaml                    # Additional descriptor file
|   `-- templates/
|       |-- template-locations.yaml
|       |-- new-java-project/
|       `-- new-nodejs-project/
|-- staging/                          # Currently empty
`-- pre-production/                  # Currently empty
```

## Local catalog wiring

`app-config.local.yaml` registers these local entry points:

- `entities.yaml` for example catalog entities.
- `templates/template-locations.yaml` with a location rule allowing `Template` entities.
- `org.yaml` with rules allowing `User`, `Group`, and `Location` entities.

`org.yaml` contains the `poc` and `guests` groups and a `Location` entity that points to `groups.yaml` and `users.yaml`. Those manifests, in turn, list the descriptor files under `users-and-groups/groups/` and `users-and-groups/users/`. Targets in a `Location` manifest are relative to that manifest, so keep these paths in sync with the directory tree.

The template location manifest similarly lists each template's `template.yaml`. Add a new template by creating its directory and descriptor, then adding its relative path to `templates/template-locations.yaml`. Catalog location targets do not expand filesystem wildcards.

## Environment differences

`app-config.production.yaml` registers the production `entities.yaml`, `templates/template-locations.yaml`, and `org.yaml`. Production template discovery follows a location manifest. Its group/user data is currently flatter than local; `production/users.yaml` is present but is not referenced by the configured locations or by the current `production/org.yaml`.

The `staging` and `pre-production` directories are placeholders at present. To use either, add the environment's descriptors and manifests, then register their entry points in the corresponding app config. Creating files under an environment directory does not make Backstage load them automatically.

## Adding catalog data

1. Put each entity descriptor under the appropriate environment and category directory.
2. For grouped descriptors, add a relative target to the relevant `Location` manifest. For a single file, register it directly in the environment's `catalog.locations` config.
3. Ensure the catalog rules allow the entity kinds being loaded. Nested `Location` entities need `Location` to be allowed as well as the `User`, `Group`, or `Template` kinds they reference.
4. Keep the environment-specific paths in `app-config.<environment>.yaml` aligned with the tree above.
