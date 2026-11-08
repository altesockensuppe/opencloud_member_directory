# Member Directory for OpenCloud

A web app for [OpenCloud](https://opencloud.eu) to manage the members of a club or association.
The member list is stored as a regular file in OpenCloud, so it can be shared with other users
using OpenCloud's built-in sharing.

Built on the [OpenCloud web app skeleton](https://github.com/opencloud-eu/web-app-skeleton).

## Features

- **Manage members**: member number, salutation, first and last name, address, date of birth,
  email, phone, mobile, date joined/left, status and notes
- **Edit directly in the table** like in a spreadsheet, or edit all details of a member in a dialog
- **Customize fields**: add, rename, reorder and delete fields, choose the type (text, multi-line
  text, number, date, email, phone, selection list, yes/no) and decide which fields are shown as
  columns
- **Search and sort** (click a column header)
- **Export** to Excel (`.xlsx`), PDF (A4) or CSV, either all members or only the current search,
  with the columns of your choice
- **Import from CSV**, with automatic detection of delimiter and character encoding and a column
  mapping with preview
- **Share** with other users via OpenCloud's regular sharing (edit or read-only)
- **English and German**, following the language setting in the user's OpenCloud profile

## Compatibility

| App   | OpenCloud            | OpenCloud Web |
| ----- | -------------------- | ------------- |
| 0.1.x | 4.0.x (stable / LTS) | 4.2           |

The app is built with the `@opencloud-eu/*` packages in version `~4.2`. Starting with
extension SDK 6.1, apps are built in a different format (module federation) that older servers
cannot load, and the 4.x format may not be supported by newer servers. To target another
OpenCloud version, align the `@opencloud-eu/*` packages with the web version of that release
(`WEB_ASSETS_VERSION` in `services/web/Makefile` of the
[OpenCloud repository](https://github.com/opencloud-eu/opencloud)).

Only OpenCloud 4.0.x has been tested.

## Installation

See also the OpenCloud documentation on
[web applications](https://docs.opencloud.eu/docs/admin/configuration/web-applications/).

1. Download `mitgliederverzeichnis-<version>.zip` from the releases page, or build it yourself
   (see [Development](#development)).
2. Extract the archive into the web apps directory, so that you end up with a folder
   `mitgliederverzeichnis` containing `manifest.json` and `js/`:
   - default: `$OC_DATA_DIR/web/assets/apps/mitgliederverzeichnis/`
   - [opencloud-compose](https://github.com/opencloud-eu/opencloud-compose):
     `config/opencloud/apps/mitgliederverzeichnis/`
3. Restart OpenCloud, e.g. `docker compose restart opencloud`.
4. Reload the browser (Ctrl+Shift+R).

When updating, delete the old contents of the folder first. The file names in `js/` change with
every build.

The app then shows up in the app switcher, under **New → Member directory** in the file view, and
`.mitglieder` files open with it.

## Usage

1. In the file view, choose **New → Member directory** and enter a name.
2. The file opens in the app. Add members, then save with the save button at the top or Ctrl+S.
3. **Share** the file (or its folder) as usual: right-click → _Share_.
   - With **edit** permission, the other person can change members.
   - With **read-only** permission, the app shows the directory read-only. Exporting is still
     possible.
   - For a board or committee, a dedicated **space** containing the directory works well.

If two people edit at the same time, OpenCloud detects the conflict when saving and warns instead
of silently overwriting the other person's changes. Earlier states can be restored from the
file's **versions** in the sidebar of the file view.

> **Privacy:** a share always covers the whole file. Everyone with access sees all fields. Keep
> sensitive details that not everyone should see in a separate file.

### Importing a CSV file

1. Open a directory, click **Import** and choose the CSV file.
2. The first line must contain the column names. The delimiter (`;`, `,`, tab) and the character
   encoding (UTF-8 or Windows-1252, which Excel often uses) are detected automatically.
3. Map each column to a field. Common German and English column names are recognized
   automatically (e.g. "Surname" or "Nachname" → last name, "Mobile", "Natel" or "Handy" →
   mobile, "Date of Birth" or "Geburtstag" → date of birth). Unknown columns are added as new
   fields, or can be set to "do not import". Columns mapped to the same field (e.g. "Street" and
   "House number") are joined with a space.
4. Choose whether to **add** the imported members or **replace** the existing ones.

Dates such as `7.3.1985`, `07.03.85`, `07/03/1985` or `1985-03-07` are recognized, always with
the **day before the month**. Lists in US format (month first) have to be converted beforehand.
Dates that are not recognized are imported as text and counted in the preview, so nothing is
lost. New values of selection fields (e.g. a status "Board") are added to the list of options.
Empty rows are skipped.

The import only changes the open directory. The file is written when you save, or by the
autosave if it is enabled in OpenCloud.

## Languages

The user interface follows the language in the user's OpenCloud profile: German or English. All
other languages get English. Dates are shown and exported as `07.03.1985` in German and as
`07/03/1985` in English, yes/no fields as "Ja/Nein" or "Yes/No".

**Field names and options** (e.g. "Last name", status "Active") are part of the file's data. They
are created in the language of the person who creates the directory and are not translated
afterwards, so customizations are kept. They can be renamed under **Fields**. The internal field
ids are the same in both languages.

German translations live in [`src/translations.ts`](src/translations.ts). OpenCloud merges app
translations into its global translations, so texts that OpenCloud itself already translates
(e.g. "Cancel", "Apply") must use exactly OpenCloud's translation. Otherwise the app would change
them everywhere in OpenCloud.

## File format

A member directory is a JSON file with the extension `.mitglieder`:

```json
{
  "version": 1,
  "title": "Sports Club Example",
  "fields": [{ "id": "vorname", "label": "First name", "type": "text", "showInList": true }],
  "members": [{ "id": "…", "values": { "vorname": "Anna", "geburtsdatum": "1985-04-12" } }]
}
```

Dates are stored as `YYYY-MM-DD`. The app id (`mitgliederverzeichnis`), the file extension and the
ids of the default fields are German for historical reasons and are kept for compatibility with
existing files.

## Development

Requirements: Node.js ≥ 22 and pnpm (`corepack enable`).

```bash
pnpm install
pnpm build            # production build into dist/
pnpm build:w          # build in watch mode
pnpm check:types      # TypeScript
pnpm lint             # ESLint
pnpm format:check     # Prettier
pnpm test:unit --run  # unit tests
```

Local test instance: keep `pnpm build:w` running and start `docker compose up` in a second
terminal. Then log in at <https://host.docker.internal:9200> with `admin` / `admin` (or one of the
demo users). `dist/` is mounted as the app.

### Project structure

| Path                  | Contents                                                    |
| --------------------- | ----------------------------------------------------------- |
| `src/index.ts`        | App registration: file type, routes, app switcher entry     |
| `src/App.vue`         | Member list (opened for `.mitglieder` files)                |
| `src/components/`     | Dialogs for members, fields, import and export              |
| `src/model.ts`        | Data model, default fields, parsing, formatting, sorting    |
| `src/import.ts`       | CSV parsing, column mapping, value conversion               |
| `src/export.ts`       | Excel, PDF and CSV export (libraries are loaded on demand)  |
| `src/i18n.ts`         | Translation helpers on top of OpenCloud's `vue3-gettext`    |
| `src/translations.ts` | German translations                                         |
| `tests/unit/`         | Unit tests, including a check that every text is translated |

New user-facing texts are written in English in the code (`t('…')`) and translated in
`src/translations.ts`. A unit test fails if a text has no translation or the placeholders differ.

### Releasing

1. Update `version` in `package.json` and add an entry to [`CHANGELOG.md`](CHANGELOG.md).
2. Commit, then create and push a tag, e.g. `git tag v0.1.0 && git push origin v0.1.0`.
3. The release workflow builds the app and attaches `mitgliederverzeichnis-<version>.zip` to a
   GitHub release.

## License

[Apache License 2.0](LICENSE)
