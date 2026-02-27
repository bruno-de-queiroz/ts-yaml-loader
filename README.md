# ts-yaml-loader

Type-safe YAML config loader for Node.js with environment variable interpolation and validation.

```bash
npm i ts-yaml-loader
```

## Features

- **Env var interpolation** — `${VAR}`, `$VAR`, `${VAR:default}` syntax with fallback defaults
- **Type-safe** — full TypeScript generics, get typed config objects from YAML
- **Validation** — plug in `class-validator` or any custom validation function
- **Path loading** — load a specific subtree from your YAML
- **Multiline support** — handles certificates, keys, and multiline values
- **Zero config** — loads `application.yaml` by default, override with `CONFIG_FILE` env var

## Quick start

```yaml
# application.yaml
port: 3000
database:
  host: ${DB_HOST:localhost}
  port: ${DB_PORT:5432}
  name: ${DB_NAME:myapp}
observability:
  version: ${npm_package_version:0.0.0}
```

```typescript
import { load } from 'ts-yaml-loader';

interface AppConfig {
  port: number;
  database: { host: string; port: number; name: string };
  observability: { version: string };
}

const config = load<AppConfig>();
// config.database.host -> "localhost" (or DB_HOST env var)
```

## Env var syntax

| Syntax | Behavior |
|---|---|
| `${VAR_NAME}` | Replace with env var, empty string if missing |
| `$VAR_NAME` | Short form, same behavior |
| `${VAR:default}` | Use default if env var is missing |
| `${VAR:value:with:colons}` | Colons in defaults work fine |
| `$$ESCAPED` | Literal `$ESCAPED` (no interpolation) |

Variable lookup is **case-insensitive** — `${db_host}` and `${DB_HOST}` resolve the same.

## Validation with class-validator

```typescript
import { load } from 'ts-yaml-loader';
import { IsNotEmpty, IsNumber, ValidateNested, validateSync } from 'class-validator';
import { plainToClass, Type } from 'class-transformer';

class DatabaseConfig {
  @IsNotEmpty()
  host: string;

  @IsNumber()
  port: number;
}

class AppConfig {
  @IsNumber()
  port: number;

  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;
}

const config = load<AppConfig>({
  validate: (value) => {
    const instance = plainToClass(AppConfig, value);
    const errors = validateSync(instance);
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.toString()).join('\n'));
    }
    return value;
  },
});
```

## API

### `load<T>(options?): T`

Loads and parses a YAML file, interpolates env vars, and returns a typed object.

```typescript
interface OptionsInput<T> {
  file?: string;            // YAML file path (default: "application.yaml")
  path?: string;            // Load a nested property (e.g., "database")
  failOnMissing?: boolean;  // Throw if data is missing (default: true)
  autoExpand?: boolean;     // Interpolate env vars (default: true)
  validate?: (value: T) => T; // Custom validation function
}
```

**Examples:**

```typescript
// Load specific section
const db = load<DatabaseConfig>({ path: 'database' });

// Custom file
const config = load<AppConfig>({ file: './config/production.yaml' });

// Skip env var expansion
const raw = load<AppConfig>({ autoExpand: false });

// Graceful fallback on missing data
const config = load<AppConfig>({ failOnMissing: false });
```

### `expand(blob: string): string`

Standalone env var interpolation for any string.

```typescript
import { expand } from 'ts-yaml-loader';

const result = expand('Hello ${USER:world}');
// -> "Hello <username>" or "Hello world"
```

## License

MIT
