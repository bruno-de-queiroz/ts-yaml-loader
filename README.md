## Description

Simple library to evaluate yaml files interpolating environment variables, validating and enforcing type safety.

## Installation
```bash
$ npm i --save bruno-de-queiroz/ts-yaml-loader
```

## Usage

```yaml
# application.yaml
port: 3000

observability:
  version: ${npm_package_version:1.0.0}

swagger:
  title: Test api
  description: APIs available for integrations
  tags:
    - api
```
```typescript
// main.ts
class ApplicationConfig {
  readonly port: string;
  readonly observability: { version: string };
  readonly swagger: {
    title: string;
    description: string;
    tags: string[];
  };
}

const config = load<ApplicationConfig>();
```

Usage with `class-validator` and `class-transformer` decorators and validations
```typescript
// main
class ApplicationConfig {
  @IsNotEmpty()
  @IsNumber()
  readonly port: string;

  @ValidateNested()
  @Type(() => ObservabilityConfig)
  readonly observability: ObservabilityConfig;

  @ValidateNested()
  @Type(() => SwaggerConfig)
  readonly swagger: SwaggerConfig;
}

const config = load<ApplicationConfig>({
  validate: (value: ApplicationConfig) => {
    const errors = validateSync(plainToClass(ApplicationConfig, value));
    if (errors.length === 0) {
      return value;
    }

    throw new Error(errors.map((it) => it.toString()))
  },
});
```
## Options and methods

```typescript
interface ConfigOptions<T> {
  /**
   * The path of the property in the yaml file to be loaded
   */
  path?: string;
  /**
   * The file path for the yaml file to be loaded
   */
  file?: string;
  /**
   * The validation method that will be called to validate the data
   */
  validate?: (value: T) => T;
  /**
   * If true will remove the variables from process.env
   */
  strict?: boolean;
}
```

* `load<T>(config?: ConfigOptions)` loads by default the `application.yaml` and uses `expand` to interpolate environment variables

* `expand(blob: string)` interpolates environment variables in a string

## Development

```bash
# development
$ npm run build
```

## Test

```bash
# unit tests
$ npm run test
```

## Commit convention

- See https://www.conventionalcommits.org/en/v1.0.0/#summary

## Versioning

- See https://semver.org/

## Auto-versioning based on commit messages

- See https://github.com/semantic-release/semantic-release
