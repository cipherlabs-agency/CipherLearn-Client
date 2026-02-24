import { AsyncLocalStorage } from "async_hooks";

/**
 * AsyncLocalStorage that carries the current request's tenantId.
 * Set by tenantContext middleware on every request.
 * Read by Prisma $extends to auto-inject WHERE tenantId = X.
 */
export const tenantStorage = new AsyncLocalStorage<number>();
