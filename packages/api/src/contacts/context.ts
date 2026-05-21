/** Safely extract contact IDs from an untyped request body or submission payload. */
export function extractContactIds(body: unknown): string[] | undefined {
  if (body == null || typeof body !== 'object') {
    return undefined;
  }

  const raw = (body as { contactIds?: unknown }).contactIds;
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const ids = raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  return ids.length > 0 ? ids : undefined;
}
