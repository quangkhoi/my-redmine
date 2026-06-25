#!/usr/bin/env node
/**
 * Fetch all table names + primary keys from MSSQL, output data/tables.json.
 *
 * Usage:
 *   node scripts/fetch-mssql.mjs
 *   node scripts/fetch-mssql.mjs --server=host --database=db --user=sa --password=pass
 */

import { createInterface } from "node:readline";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sql from "mssql";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "connection.local.json");

async function prompt(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (a) => { rl.close(); resolve(a.trim()); }));
}

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--(\w+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

function loadSavedConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function saveConfig(server, database, user) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify({ server, database, user }, null, 2), "utf-8");
    console.log(`  Config saved to scripts/connection.local.json (password NOT saved)`);
  } catch {}
}

function getServerInfo(connConfig) {
  return connConfig.server || "";
}

async function getConfig(args) {
  const saved = loadSavedConfig();
  const server = args.server || process.env.MSSQL_SERVER || saved.server || (await prompt("Server: "));
  const database = args.database || process.env.MSSQL_DATABASE || saved.database || (await prompt("Database: "));
  const user = args.user || process.env.MSSQL_USER || saved.user || (await prompt("Username: "));
  const password = args.password || process.env.MSSQL_PASS || (await prompt("Password: "));

  if (!saved.server || !saved.database || !saved.user) {
    saveConfig(server, database, user);
  }
  return { server, database, user, password };
}

async function fetchSchema(connConfig) {
  const pool = await sql.connect({
    server: connConfig.server,
    database: connConfig.database,
    user: connConfig.user,
    password: connConfig.password,
    options: { encrypt: false, trustServerCertificate: true },
  });

  const result = await pool.request().query(`
    SELECT
      t.TABLE_SCHEMA,
      t.TABLE_NAME,
      c.COLUMN_NAME
    FROM INFORMATION_SCHEMA.TABLES t
    INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      ON t.TABLE_SCHEMA = tc.TABLE_SCHEMA
      AND t.TABLE_NAME = tc.TABLE_NAME
      AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c
      ON tc.CONSTRAINT_NAME = c.CONSTRAINT_NAME
      AND tc.TABLE_NAME = c.TABLE_NAME
    WHERE t.TABLE_TYPE = 'BASE TABLE'
    ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
  `);

  const tables = {};
  for (const row of result.recordset) {
    const name = row.TABLE_NAME;
    if (!tables[name]) {
      tables[name] = { schema: row.TABLE_SCHEMA, pk: [] };
    }
    tables[name].pk.push(row.COLUMN_NAME);
  }

  await pool.close();
  return tables;
}

async function main() {
  const args = parseArgs();
  const connConfig = await getConfig(args);
  const tables = await fetchSchema(connConfig);

  const output = {
    server: connConfig.server,
    database: connConfig.database,
    totalTables: Object.keys(tables).length,
    fetchedAt: new Date().toISOString(),
    tables,
  };

  const outPath = join(__dirname, "..", "data", "tables.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\nOK: ${output.totalTables} tables written to data/tables.json`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
