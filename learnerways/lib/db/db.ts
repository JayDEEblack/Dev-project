import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH =
  process.env.DB_PATH ??
  (process.env.VERCEL ? "/tmp/learnerways.db" : "sqlite.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

bootstrapSchema(sqlite);

function bootstrapSchema(sqlite: InstanceType<typeof Database>) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS \`user\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`name\` text NOT NULL,
      \`email\` text NOT NULL,
      \`email_verified\` integer DEFAULT false NOT NULL,
      \`image\` text,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`user_email_unique\` ON \`user\` (\`email\`);
    CREATE TABLE IF NOT EXISTS \`session\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`expires_at\` integer NOT NULL,
      \`token\` text NOT NULL,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL,
      \`ip_address\` text,
      \`user_agent\` text,
      \`user_id\` text NOT NULL,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`session_token_unique\` ON \`session\` (\`token\`);
    CREATE TABLE IF NOT EXISTS \`account\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`account_id\` text NOT NULL,
      \`provider_id\` text NOT NULL,
      \`issuer\` text NOT NULL,
      \`user_id\` text NOT NULL,
      \`access_token\` text,
      \`refresh_token\` text,
      \`id_token\` text,
      \`access_token_expires_at\` integer,
      \`refresh_token_expires_at\` integer,
      \`scope\` text,
      \`password\` text,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE TABLE IF NOT EXISTS \`verification\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`identifier\` text NOT NULL,
      \`value\` text NOT NULL,
      \`expires_at\` integer NOT NULL,
      \`created_at\` integer,
      \`updated_at\` integer NOT NULL
    );
    CREATE TABLE IF NOT EXISTS \`material\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`user_id\` text NOT NULL,
      \`title\` text NOT NULL,
      \`content\` text NOT NULL,
      \`source_type\` text DEFAULT 'text' NOT NULL,
      \`file_name\` text,
      \`created_at\` integer NOT NULL,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE TABLE IF NOT EXISTS \`summary\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`material_id\` text NOT NULL,
      \`content\` text NOT NULL,
      \`created_at\` integer NOT NULL,
      FOREIGN KEY (\`material_id\`) REFERENCES \`material\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE TABLE IF NOT EXISTS \`audio_file\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`material_id\` text NOT NULL,
      \`file_name\` text NOT NULL,
      \`data\` blob,
      \`created_at\` integer NOT NULL,
      FOREIGN KEY (\`material_id\`) REFERENCES \`material\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`audio_file_material_id_unique\` ON \`audio_file\` (\`material_id\`);
    CREATE TABLE IF NOT EXISTS \`quiz\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`material_id\` text NOT NULL,
      \`title\` text NOT NULL,
      \`questions\` text NOT NULL,
      \`created_at\` integer NOT NULL,
      FOREIGN KEY (\`material_id\`) REFERENCES \`material\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE TABLE IF NOT EXISTS \`flashcard\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`material_id\` text NOT NULL,
      \`cards\` text NOT NULL,
      \`created_at\` integer NOT NULL,
      FOREIGN KEY (\`material_id\`) REFERENCES \`material\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `);

  try {
    sqlite.exec("ALTER TABLE `audio_file` ADD COLUMN `data` blob");
  } catch {
    // column already exists in databases created before this change
  }
}

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;
