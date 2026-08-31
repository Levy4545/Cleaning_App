/**
 * Resolve and normalize the app Postgres URL for local Docker, Vercel, and Supabase.
 *
 * Accepts DATABASE_URL plus common host aliases (POSTGRES_URL, Neon/Vercel names).
 * Encodes passwords that contain @ # % so pasted URIs still parse.
 */

export const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL",
] as const;

export class DatabaseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUrlError";
  }
}

export function readRawDatabaseUrl(env: NodeJS.Dict<string | undefined> = process.env): string | undefined {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = env[key]?.trim();
    if (value) return stripWrappingQuotes(value);
  }
  return undefined;
}

export function resolveDatabaseUrl(env: NodeJS.Dict<string | undefined> = process.env): string {
  const raw = readRawDatabaseUrl(env);
  if (!raw) {
    throw new DatabaseUrlError(
      `Missing database URL. Set DATABASE_URL (or POSTGRES_URL) to the Postgres URI.\n` +
        `On Supabase: Project → Connect → connection string → Transaction pooler. ` +
        `Use the database password, not the service_role API key.`,
    );
  }
  return normalizeDatabaseUrl(raw);
}

export function normalizeDatabaseUrl(raw: string): string {
  const encoded = encodeUserinfo(stripWrappingQuotes(raw.trim()));
  if (!/^(postgres|postgresql):\/\//i.test(encoded)) {
    throw new DatabaseUrlError("Database URL must start with postgres:// or postgresql://");
  }

  let parsed: URL;
  try {
    parsed = new URL(encoded);
  } catch {
    throw new DatabaseUrlError(
      "Could not parse DATABASE_URL. If the password has @ # or %, URL-encode it or paste the URI as-is — we encode it automatically when possible.",
    );
  }

  if (!isLocalDatabaseHost(parsed.hostname) && !parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  return parsed.toString();
}

export function isLocalDatabaseHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

export function isTransactionPoolerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.port === "6543" || parsed.hostname.includes("pooler.supabase.com");
  } catch {
    return false;
  }
}

export function postgresClientOptions(url: string): {
  max: number;
  idle_timeout: number;
  connect_timeout: number;
  prepare: boolean;
  ssl: "require" | undefined;
} {
  let local = false;
  try {
    local = isLocalDatabaseHost(new URL(url).hostname);
  } catch {
    local = false;
  }

  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  return {
    max: serverless ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 30,
    // Transaction pooler (Supabase :6543 / PgBouncer) rejects prepared statements.
    prepare: false,
    ssl: local ? undefined : "require",
  };
}

export function explainDatabaseError(error: unknown): string {
  const cause = error && typeof error === "object" && "cause" in error ? (error as { cause?: unknown }).cause : error;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
  const message = error instanceof Error ? error.message : String(error);

  if (code === "28P01" || /password authentication failed/i.test(message)) {
    return [
      "Postgres rejected the DATABASE_URL password (user is usually \"postgres\").",
      "This is not the service_role / secret API key.",
      "Supabase: Project Settings → Database → copy the database password into the connection URI,",
      "or copy Connect → Transaction pooler and replace [YOUR-PASSWORD].",
      "Encode @ # % in the password if you paste it by hand.",
    ].join(" ");
  }

  if (code === "42P01" || /relation .* does not exist/i.test(message)) {
    return "Database connected but tables are missing. Redeploy so migrations run, or run: npm run db:migrate";
  }

  if (code === "ENOTFOUND" || /getaddrinfo/i.test(message)) {
    return "Could not resolve the database host. On Vercel, use the Supabase Transaction pooler URI (port 6543), not db.<project>.supabase.co:5432.";
  }

  return message;
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Encode user:password so characters like @ in the password do not split the host. */
function encodeUserinfo(connectionString: string): string {
  const match = connectionString.match(/^(postgres(?:ql)?):\/\/([^/]+)(\/.*)?$/i);
  if (!match) return connectionString;

  const protocol = match[1];
  const authority = match[2];
  const path = match[3] ?? "";
  const at = authority.lastIndexOf("@");
  if (at <= 0) return connectionString;

  const userinfo = authority.slice(0, at);
  const host = authority.slice(at + 1);
  const colon = userinfo.indexOf(":");
  if (colon < 0) {
    return `${protocol}://${encodeURIComponent(decodeMaybe(userinfo))}@${host}${path}`;
  }

  const user = decodeMaybe(userinfo.slice(0, colon));
  const password = decodeMaybe(userinfo.slice(colon + 1));
  return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}${path}`;
}

function decodeMaybe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
