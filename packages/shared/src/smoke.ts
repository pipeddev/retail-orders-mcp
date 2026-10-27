import { pool, query } from "./db.ts";

const rows = await query<{ id: number; status: string; total_clp: number }>(
  "SELECT id, status, total_clp FROM orders ORDER BY id",
);
console.table(rows);
await pool.end();
