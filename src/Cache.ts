/**
 * A key-value store which allows to store various metadata for a cursor.
 */
export default interface Cache {
  read(key: string): Promise<object | null>;
  write(key: string, value: object): Promise<unknown>;
}
