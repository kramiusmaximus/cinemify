import type { Request, Response, NextFunction } from "express";
import type { ZodError, ZodTypeAny } from "zod";

// Accept any Zod schema (including ZodEffects/ZodDefault), not just plain objects.
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid request body",
        details: formatZodError(result.error),
      });
    }

    req.body = result.data;
    next();
  };
}

function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
