import postgres from "postgres";

import { postgresClientOptions, resolveDatabaseUrl } from "./connection-url";

export function createSqlClient(
  url: string = resolveDatabaseUrl(),
  overrides: { max?: number } = {},
) {
  return postgres(url, {
    ...postgresClientOptions(url),
    ...overrides,
  });
}
