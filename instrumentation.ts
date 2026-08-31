import type { Instrumentation } from "next";
import { alertServerError } from "@/lib/quota/errorAlerts";

// Safety net for API routes: catches server errors that escape a route
// handler uncaught (a bug with no try/catch, not a caught-and-logged
// failure -- those already alert at their own call sites). Scoped to App
// Router route handlers only ('route'), not page/component rendering
// errors, per the "unhandled error on an API route" requirement.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (context.routerKind !== "App Router" || context.routeType !== "route") return;
  const message = err instanceof Error ? err.message : String(err);
  await alertServerError(context.routePath || request.path, message);
};
