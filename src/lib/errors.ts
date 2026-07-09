/**
 * Log a database/server error server-side with context, but never surface the
 * raw error (which can leak column names, constraints, and schema details) to
 * the client. Callers return/throw a generic message instead.
 */
export function logDbError(context: string, error: unknown): void {
  console.error(`[db] ${context}:`, error);
}
