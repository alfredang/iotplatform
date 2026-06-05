import { ZodError, type ZodType } from "zod";
import { AuthError } from "@/lib/auth/rbac";

/** Parse a Request's JSON body against a Zod schema, throwing on failure. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
  return schema.parse(json);
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** Standardised error -> Response mapping for all API routes. */
export function handleApiError(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return Response.json(
      { error: "Validation failed", issues: err.flatten() },
      { status: 422 },
    );
  }
  if (err instanceof ValidationError) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}
