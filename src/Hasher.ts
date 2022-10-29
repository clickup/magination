export default interface Hasher<THit> {
  (hit: THit): string;
}
