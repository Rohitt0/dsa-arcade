import type { ZodError } from 'zod';

/** Flattens a ZodError into a { fieldName: firstMessage } map for inline form display. */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errs[key]) errs[key] = issue.message;
  }
  return errs;
}
