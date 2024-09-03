export interface OptionsInput<T> {
  /**
   * The path of the property in the yaml file to be loaded
   */
  path?: string;
  /**
   * Fails if the path is not found or the data is not parseable in the file. default: true
   */
  failOnMissing?: boolean;
  /**
   * The file path for the yaml file to be loaded
   */
  file?: string;
  /**
   * The validation method that will be called to validate the data
   */
  validate?: (value: T) => T;
  /**
   * Expand environment variables or not
   */
  autoExpand?: boolean;
}
