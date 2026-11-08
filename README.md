# Member Directory for OpenCloud

An [OpenCloud](https://opencloud.eu) web app to manage the members of a club. The list is stored
as a `.members` file and shared with OpenCloud's built-in sharing.

## Features

- Member list with inline editing, search and sort
- Customizable fields
- Export to Excel, PDF and CSV
- Import from CSV
- English and German, following the user's profile language

## Compatibility

Built for **OpenCloud 4.0.x** (OpenCloud Web 4.2). Newer versions are untested.

## Installation

1. Download `member-directory-<version>.zip` from the releases.
2. Extract it into the web apps directory, e.g. `$OC_DATA_DIR/web/assets/apps/` or
   `config/opencloud/apps/` with [opencloud-compose](https://github.com/opencloud-eu/opencloud-compose).
3. Restart OpenCloud.

The app then appears under **New → Member directory** in the file view.

## Development

```bash
pnpm install
pnpm build            # build into dist/
pnpm test:unit --run  # unit tests
```

`docker compose up` starts a local OpenCloud at <https://host.docker.internal:9200>
(`admin` / `admin`) with `dist/` mounted as the app.

## License

[Apache License 2.0](LICENSE)
