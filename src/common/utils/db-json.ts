export function serializeJson(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return JSON.stringify(null);
  return JSON.stringify(value);
}
