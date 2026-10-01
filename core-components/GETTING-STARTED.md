# Core Components: Beginner Guide

This folder contains sample data that Backstage can show in the catalog and templates that people can use to create software.

## How Backstage finds the files

Think of the YAML files as notes and the `Location` files as lists that point to other notes. Backstage starts from the locations configured for an environment, then follows those lists.

For local development, the path looks like this:

```text
app-config.local.yaml
  -> local/org.yaml
       -> local/groups.yaml
            -> local/users-and-groups/groups/*.yaml
       -> local/users.yaml
            -> local/users-and-groups/users/*.yaml
  -> local/templates/template-locations.yaml
       -> local/templates/*/template.yaml
```

The `*` above is just a shortcut in this guide to show multiple files. Backstage does not expand a wildcard in a catalog location; the YAML manifest must list each file path.

## Add a group

1. Create a YAML file, for example `local/users-and-groups/groups/analytics.yaml`:

   ```yaml
   apiVersion: backstage.io/v1alpha1
   kind: Group
   metadata:
     name: analytics
   spec:
     type: team
     children: []
   ```

2. Add its path to `local/groups.yaml` under `spec.targets`:

   ```yaml
   - ./users-and-groups/groups/analytics.yaml
   ```

3. To make it a child of another group, add `analytics` to that group's `spec.children` list. For example, edit `local/org.yaml` if it should be a child of `poc`.

Group names in `children` must match the `metadata.name` in the child group's file.

## Add a user

1. Create a YAML file in `local/users-and-groups/users/`:

   ```yaml
   apiVersion: backstage.io/v1alpha1
   kind: User
   metadata:
     name: sam
   spec:
     memberOf: [analytics]
   ```

2. Add the file's path to `local/users.yaml` under `spec.targets`.

The group named in `memberOf` must already exist in the catalog.

## Add a template

1. Create a folder under `local/templates/`, such as `local/templates/new-tool/`.
2. Put the Backstage template descriptor in that folder as `template.yaml`.
3. Add `./new-tool/template.yaml` to `local/templates/template-locations.yaml` under `spec.targets`.

The local catalog config allows `Template` entities from this template location.

## A few useful reminders

- Paths inside `groups.yaml`, `users.yaml`, and `template-locations.yaml` are relative to the manifest that contains them.
- Add every new file to its manifest. New files are not discovered just because they are in the folder.
- `app-config.local.yaml` loads local data. Production has its own config and data under `production/`.
- If you change the app config's catalog locations, restart the local Backstage process so it reloads them.
