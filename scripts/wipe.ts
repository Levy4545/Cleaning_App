/**
 * Wipe selected app data from Postgres (local/dev reset helper).
 *
 * Usage:
 *   npm run db:wipe -- --help
 *   npm run db:wipe -- appointments availability
 *   npm run db:wipe -- appointments availability --yes
 *   npm run db:wipe -- users --keep-admins --yes
 *   npm run db:wipe -- all --yes
 *   npm run db:wipe -- catalog --shop 00000000-0000-4000-8000-000000000001 --yes
 *
 * Targets (comma or space separated):
 *   appointments | availability | users | notifications | messages | catalog | members | all
 *
 * Flags:
 *   --yes              Actually delete (default is dry-run)
 *   --keep-admins      When wiping users, keep role=ADMIN
 *   --keep-email=x     When wiping users, keep this email (repeatable)
 *   --shop=<uuid>      Limit shop-scoped tables to this shop (default: all shops)
 *   --include-shops    With `all`, also delete shops rows (dangerous)
 *   --allow-remote     Required when DATABASE_URL host is not localhost
 */
import postgres from "postgres";

import { DEFAULT_SHOP_ID } from "../src/db/schema";

const TARGETS = [
  "appointments",
  "availability",
  "users",
  "notifications",
  "messages",
  "catalog",
  "members",
  "all",
] as const;

type Target = (typeof TARGETS)[number];

const ALIASES: Record<string, Target> = {
  appointments: "appointments",
  bookings: "appointments",
  availability: "availability",
  slots: "availability",
  users: "users",
  notifications: "notifications",
  messages: "messages",
  catalog: "catalog",
  services: "catalog",
  members: "members",
  "shop-members": "members",
  all: "all",
};

type Options = {
  targets: Target[];
  yes: boolean;
  keepAdmins: boolean;
  keepEmails: string[];
  shopId: string | null;
  includeShops: boolean;
  allowRemote: boolean;
};

function printHelp() {
  console.log(`Wipe selected tables from the app database.

Usage:
  npm run db:wipe -- <targets...> [flags]

Targets:
  appointments   bookings + items, payments, job_logs, reviews
  availability   availability_slots (deletes referencing appointments first)
  users          users (+ cascaded profiles/addresses/members/…)
  notifications  notifications
  messages       messages
  catalog        services + service_categories
  members        shop_members
  all            everything above (shops kept unless --include-shops)

Flags:
  --yes                 Perform deletes (omit for dry-run counts)
  --keep-admins         Keep ADMIN users when wiping users
  --keep-email=addr     Keep this email when wiping users (repeatable)
  --shop=<uuid>         Limit shop-scoped deletes (omit = all shops)
  --include-shops       Also delete shops when using "all"
  --allow-remote        Required for non-localhost DATABASE_URL hosts

Examples:
  npm run db:wipe -- appointments availability
  npm run db:wipe -- appointments availability --yes
  npm run db:wipe -- users --keep-admins --yes
  npm run db:wipe -- all --shop=${DEFAULT_SHOP_ID} --yes
`);
}

/**
 * Determines whether a database URL points to a local host.
 *
 * @param url - The database URL to inspect
 * @returns `true` if the URL host is `localhost`, `127.0.0.1`, or `::1`, `false` otherwise
 */
function isLocalDatabaseHost(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * Parses command-line arguments into validated wipe options.
 *
 * @param argv - Command-line arguments excluding the executable and script path
 * @returns `"help"` when help is requested or no arguments are provided; otherwise, the parsed wipe options
 */
function parseArgs(argv: string[]): Options | "help" {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    return "help";
  }

  const targets = new Set<Target>();
  let yes = false;
  let keepAdmins = false;
  let includeShops = false;
  let allowRemote = false;
  let shopId: string | null = null;
  const keepEmails: string[] = [];

  for (const raw of argv) {
    if (raw === "--yes" || raw === "-y") {
      yes = true;
      continue;
    }
    if (raw === "--keep-admins") {
      keepAdmins = true;
      continue;
    }
    if (raw === "--include-shops") {
      includeShops = true;
      continue;
    }
    if (raw === "--allow-remote") {
      allowRemote = true;
      continue;
    }
    if (raw.startsWith("--keep-email=")) {
      const email = raw.slice("--keep-email=".length).trim().toLowerCase();
      if (email) keepEmails.push(email);
      continue;
    }
    if (raw.startsWith("--shop=")) {
      shopId = raw.slice("--shop=".length).trim() || null;
      continue;
    }
    if (raw === "--shop") {
      throw new Error("Use --shop=<uuid>");
    }

    for (const part of raw.split(",")) {
      const key = part.trim().toLowerCase();
      if (!key) continue;
      const mapped = ALIASES[key];
      if (!mapped) {
        throw new Error(`Unknown target "${part}". Valid: ${TARGETS.join(", ")}`);
      }
      targets.add(mapped);
    }
  }

  if (targets.size === 0) {
    throw new Error("Specify at least one target. Use --help for usage.");
  }

  return {
    targets: [...targets],
    yes,
    keepAdmins,
    keepEmails,
    shopId,
    includeShops,
    allowRemote,
  };
}

function expandTargets(targets: Target[]): Exclude<Target, "all">[] {
  if (targets.includes("all")) {
    return [
      "appointments",
      "availability",
      "notifications",
      "messages",
      "catalog",
      "members",
      "users",
    ];
  }
  return targets.filter((t): t is Exclude<Target, "all"> => t !== "all");
}

async function count(sql: postgres.Sql, query: string, params: unknown[] = []) {
  const rows = await sql.unsafe(query, params as never[]);
  return Number(rows[0]?.count ?? 0);
}

/**
 * Executes the database wipe command according to the parsed command-line options.
 *
 * @throws If `DATABASE_URL` is missing, targets a non-local host without `--allow-remote`, or the wipe operation fails.
 */
async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed === "help") {
    printHelp();
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  if (!isLocalDatabaseHost(url) && !parsed.allowRemote) {
    let host = "(unparseable)";
    try {
      host = new URL(url).hostname;
    } catch {
      // ignore
    }
    throw new Error(
      `Refusing to wipe non-local database host "${host}". Pass --allow-remote if you really mean it.`,
    );
  }

  const sql = postgres(url, { max: 1 });
  const plan = expandTargets(parsed.targets);
  const shopFilter = parsed.shopId;
  const shopClause = shopFilter ? "AND shop_id = $1" : "";
  const shopParams = shopFilter ? [shopFilter] : [];

  console.log(parsed.yes ? "MODE: DELETE" : "MODE: dry-run (pass --yes to delete)");
  console.log("Targets:", plan.join(", "));
  console.log("Shop filter:", shopFilter ?? "(all shops)");
  if (plan.includes("users")) {
    console.log(
      "Users keep:",
      [
        parsed.keepAdmins ? "ADMIN role" : null,
        ...parsed.keepEmails.map((e) => `email=${e}`),
      ]
        .filter(Boolean)
        .join(", ") || "(none)",
    );
  }
  console.log("");

  type Step = { label: string; countSql: string; deleteSql: string; params?: unknown[] };
  const steps: Step[] = [];

  const addAppointmentWipe = () => {
    const p = shopParams;
    const sc = shopClause;
    steps.push({
      label: "reviews",
      countSql: `SELECT count(*)::int AS count FROM reviews WHERE true ${sc}`,
      deleteSql: `DELETE FROM reviews WHERE true ${sc}`,
      params: p,
    });
    steps.push({
      label: "payments",
      countSql: `SELECT count(*)::int AS count FROM payments WHERE true ${sc}`,
      deleteSql: `DELETE FROM payments WHERE true ${sc}`,
      params: p,
    });
    steps.push({
      label: "job_logs",
      countSql: `SELECT count(*)::int AS count FROM job_logs WHERE true ${sc}`,
      deleteSql: `DELETE FROM job_logs WHERE true ${sc}`,
      params: p,
    });
    steps.push({
      label: "appointment_items",
      countSql: shopFilter
        ? `SELECT count(*)::int AS count FROM appointment_items ai
           JOIN appointments a ON a.id = ai.appointment_id
           WHERE a.shop_id = $1`
        : `SELECT count(*)::int AS count FROM appointment_items`,
      deleteSql: shopFilter
        ? `DELETE FROM appointment_items ai
           USING appointments a
           WHERE a.id = ai.appointment_id AND a.shop_id = $1`
        : `DELETE FROM appointment_items`,
      params: p,
    });
    steps.push({
      label: "appointments",
      countSql: `SELECT count(*)::int AS count FROM appointments WHERE true ${sc}`,
      deleteSql: `DELETE FROM appointments WHERE true ${sc}`,
      params: p,
    });
  };

  if (plan.includes("appointments") || plan.includes("availability") || plan.includes("catalog")) {
    // catalog/availability need appointments gone first (RESTRICT FKs)
    if (!plan.includes("appointments") && (plan.includes("availability") || plan.includes("catalog"))) {
      console.log(
        "Note: also clearing appointments first (required by FK restrict on slots/services).",
      );
    }
    addAppointmentWipe();
  }

  if (plan.includes("availability")) {
    steps.push({
      label: "availability_slots",
      countSql: `SELECT count(*)::int AS count FROM availability_slots WHERE true ${shopClause}`,
      deleteSql: `DELETE FROM availability_slots WHERE true ${shopClause}`,
      params: shopParams,
    });
  }

  if (plan.includes("notifications")) {
    steps.push({
      label: "notifications",
      countSql: `SELECT count(*)::int AS count FROM notifications WHERE true ${shopClause}`,
      deleteSql: `DELETE FROM notifications WHERE true ${shopClause}`,
      params: shopParams,
    });
  }

  if (plan.includes("messages")) {
    steps.push({
      label: "messages",
      countSql: `SELECT count(*)::int AS count FROM messages WHERE true ${shopClause}`,
      deleteSql: `DELETE FROM messages WHERE true ${shopClause}`,
      params: shopParams,
    });
  }

  if (plan.includes("catalog")) {
    steps.push({
      label: "services",
      countSql: `SELECT count(*)::int AS count FROM services WHERE true ${shopClause}`,
      deleteSql: `DELETE FROM services WHERE true ${shopClause}`,
      params: shopParams,
    });
    steps.push({
      label: "service_categories",
      countSql: `SELECT count(*)::int AS count FROM service_categories WHERE true ${shopClause}`,
      deleteSql: `DELETE FROM service_categories WHERE true ${shopClause}`,
      params: shopParams,
    });
  }

  if (plan.includes("members")) {
    steps.push({
      label: "shop_members",
      countSql: `SELECT count(*)::int AS count FROM shop_members WHERE true ${shopClause}`,
      deleteSql: `DELETE FROM shop_members WHERE true ${shopClause}`,
      params: shopParams,
    });
  }

  if (plan.includes("users")) {
    // Clear shop-scoped leftovers that may still reference users outside cascade paths.
    if (!plan.includes("notifications")) {
      steps.push({
        label: "notifications (for user wipe)",
        countSql: shopFilter
          ? `SELECT count(*)::int AS count FROM notifications WHERE shop_id = $1`
          : `SELECT count(*)::int AS count FROM notifications`,
        deleteSql: shopFilter
          ? `DELETE FROM notifications WHERE shop_id = $1`
          : `DELETE FROM notifications`,
        params: shopParams,
      });
    }
    if (!plan.includes("messages")) {
      steps.push({
        label: "messages (for user wipe)",
        countSql: shopFilter
          ? `SELECT count(*)::int AS count FROM messages WHERE shop_id = $1`
          : `SELECT count(*)::int AS count FROM messages`,
        deleteSql: shopFilter
          ? `DELETE FROM messages WHERE shop_id = $1`
          : `DELETE FROM messages`,
        params: shopParams,
      });
    }

    const keepParts: string[] = [];
    const userParams: unknown[] = [];
    if (parsed.keepAdmins) {
      keepParts.push(`role = 'ADMIN'`);
    }
    for (const email of parsed.keepEmails) {
      userParams.push(email);
      keepParts.push(`lower(email) = $${userParams.length}`);
    }
    const keepSql = keepParts.length ? `WHERE NOT (${keepParts.join(" OR ")})` : "";

    // When shop-filtered, only delete users who have addresses/memberships/appointments in that shop
    // and no remaining ties elsewhere — simpler: shop filter deletes users linked to that shop only
    // via membership or as customer with address in shop. For MVP, shop filter on users =
    // delete users who appear in shop_members for that shop OR have appointments in that shop,
    // still respecting keep rules.
    if (shopFilter) {
      const shopParamIndex = userParams.length + 1;
      userParams.push(shopFilter);
      steps.push({
        label: "users (shop-linked)",
        countSql: `
          SELECT count(*)::int AS count FROM users u
          WHERE u.id IN (
            SELECT user_id FROM shop_members WHERE shop_id = $${shopParamIndex}
            UNION
            SELECT customer_id FROM appointments WHERE shop_id = $${shopParamIndex}
            UNION
            SELECT user_id FROM addresses WHERE shop_id = $${shopParamIndex}
            UNION
            SELECT user_id FROM notifications WHERE shop_id = $${shopParamIndex}
          )
          ${keepParts.length ? `AND NOT (${keepParts.join(" OR ")})` : ""}
        `,
        deleteSql: `
          DELETE FROM users u
          WHERE u.id IN (
            SELECT user_id FROM shop_members WHERE shop_id = $${shopParamIndex}
            UNION
            SELECT customer_id FROM appointments WHERE shop_id = $${shopParamIndex}
            UNION
            SELECT user_id FROM addresses WHERE shop_id = $${shopParamIndex}
            UNION
            SELECT user_id FROM notifications WHERE shop_id = $${shopParamIndex}
          )
          ${keepParts.length ? `AND NOT (${keepParts.join(" OR ")})` : ""}
        `,
        params: userParams,
      });
    } else {
      steps.push({
        label: "users",
        countSql: `SELECT count(*)::int AS count FROM users ${keepSql}`,
        deleteSql: `DELETE FROM users ${keepSql}`,
        params: userParams,
      });
    }
  }

  if (parsed.targets.includes("all") && parsed.includeShops) {
    steps.push({
      label: "shops",
      countSql: shopFilter
        ? `SELECT count(*)::int AS count FROM shops WHERE id = $1`
        : `SELECT count(*)::int AS count FROM shops`,
      deleteSql: shopFilter ? `DELETE FROM shops WHERE id = $1` : `DELETE FROM shops`,
      params: shopParams,
    });
  }

  // Deduplicate by label while preserving order
  const seen = new Set<string>();
  const uniqueSteps = steps.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });

  let total = 0;
  for (const step of uniqueSteps) {
    const n = await count(sql, step.countSql, step.params ?? []);
    total += n;
    console.log(`  ${step.label}: ${n}`);
  }
  console.log(`\nTotal matching rows: ${total}`);

  if (!parsed.yes) {
    console.log("\nDry-run only. Re-run with --yes to delete.");
    await sql.end();
    return;
  }

  await sql.begin(async (tx) => {
    for (const step of uniqueSteps) {
      const result = await tx.unsafe(step.deleteSql, (step.params ?? []) as never[]);
      const deleted = Array.isArray(result) ? result.count : 0;
      console.log(`Deleted ${step.label}: ${deleted ?? "ok"}`);
    }
  });

  console.log("\nDone.");
  if (plan.includes("catalog") || (parsed.targets.includes("all") && parsed.includeShops)) {
    console.log("Tip: run `npm run db:seed` to restore the default shop catalog.");
  }
  await sql.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
