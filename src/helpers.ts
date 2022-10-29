import uniqid from "uniqid";

const CURSOR_SEP = ":";

export function createCursor(): string {
  return uniqid();
}

export function parseCursor(cursor: string | null): [string, number] {
  return cursor?.match(new RegExp(`^(\\w{1,32})${CURSOR_SEP}(\\d{1,6})$`))
    ? [RegExp.$1, parseInt(RegExp.$2)]
    : [createCursor(), 0];
}

export function buildCursor(slotKey: string, num: number): string {
  return slotKey + CURSOR_SEP + num.toString();
}
