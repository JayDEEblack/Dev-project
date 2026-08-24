import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const materials = sqliteTable("material", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceType: text("source_type", { enum: ["text", "pdf"] })
    .notNull()
    .default("text"),
  fileName: text("file_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const summaries = sqliteTable("summary", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const audioFiles = sqliteTable("audio_file", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .unique()
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const quizzes = sqliteTable("quiz", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  questions: text("questions").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const flashcards = sqliteTable("flashcard", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  cards: text("cards").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Material = typeof materials.$inferSelect;
export type Summary = typeof summaries.$inferSelect;
export type AudioFile = typeof audioFiles.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type FlashcardSet = typeof flashcards.$inferSelect;