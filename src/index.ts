import * as YAML from 'yamljs';
import { readFileSync } from 'fs';
import { OptionsInput } from './options.input';
import * as process from 'node:process';

const CONFIG_FILE = process.env.CONFIG_FILE || 'application.yaml';
const ENV_REGEX = /(?<!\$)\$(([a-z\d_]+)|\{([^:}]+)}|\{([^:]+):(.*)})/gi;

/**
 * Load a yaml file and expand the environment variables
 * @param options (@see ConfigOptionsInterface)
 */
export function load<T>(options?: OptionsInput<T>): T {
  const envFile = options?.file || CONFIG_FILE;
  const failOnMissing = options?.failOnMissing ?? true;
  const path = options?.path;
  const autoExpand = options?.autoExpand ?? true;
  const validateFn = options?.validate || ((data) => data);
  const isDefined = (data: any) => data !== undefined && data !== null;
  const requiredFn = (data: unknown): T => {
    if (isDefined(data)) {
      return data as T;
    }

    if (failOnMissing) {
      throw new Error(
        'Failed to initialize config, the data is missing or invalid',
      );
    }
    return {} as T;
  };

  const configData = YAML.parse(
    autoExpand
      ? expand(readFileSync(envFile, 'utf8'))
      : readFileSync(envFile, 'utf8'),
  ) as T;
  try {
    return validateFn(requiredFn(path ? configData[path] : configData));
  } catch (e) {
    throw new Error(`Failed to initialize config is not valid: ${e.message}`);
  }
}

/**
 * Interpolate environment variables in a string
 * @param blob string to be interpolated
 */
export function expand(blob: string): string {
  const interpolateVariable = (variable: string): string => {
    const [key, ...rest] = variable
      .replace(/^\$\{?(.*)$/g, (_, group) => group.replace(/}$/, ''))
      .split(':');
    return process.env[key.toUpperCase()] || rest.join(':');
  };

  const replaceEscapedDollarSigns = (str: string): string => {
    return str.replace('$$', '$');
  };

  const expandInnerValue = (str: string): string => {
    return str.replace(/\$\{([^}]+)}/, (_, key) => interpolateVariable(key));
  };

  const interpolateValue = (matched: string): string => {
    const value = interpolateVariable(matched);
    return value.includes('\n') ? `"${value.replace(/\n/g, '\\n')}"` : value;
  };

  return expandInnerValue(
    replaceEscapedDollarSigns(blob.replace(ENV_REGEX, interpolateValue)),
  );
}
