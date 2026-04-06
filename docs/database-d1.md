# Database: Cloudflare D1

This project uses Drizzle ORM with Cloudflare D1 (serverless SQLite at the edge).

## Schema Definition

- Use `drizzle-orm/sqlite-core` to define table schemas.
- Schema file: `packages/db/src/schema.ts`

## Migrations

- **Generate**: After changing schemas, run `pnpm run db:generate` from `packages/db/`.
- **Apply**: Migrations are auto-applied when running `pnpm dev` (local) or deploying (production) via Alchemy.

## Drizzle Usage

Drizzle has two modes. **We ONLY use the SQL-like API**:

```ts
// Correct: SQL-like API
db.select().from(table).where(...)

// Incorrect: Do NOT use Relational Query API
db.query.table.findMany(...)
```

## Custom SQL Migrations

When you need manual SQL (data migration, complex operations):

1. Run `pnpm exec drizzle-kit generate --custom --name=<migration_name>` in `packages/db/`
2. Populate the generated `.sql` file with your SQL commands
3. **NEVER** manually create `.sql` files in the migrations folder or edit `_journal.json`
