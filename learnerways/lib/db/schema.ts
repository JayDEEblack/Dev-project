import {
  pgTable,
  text,
  boolean,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
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
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at").notNull(),
});

export const materials = pgTable("material", {
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
  createdAt: timestamp("created_at").notNull(),
});

export const summaries = pgTable("summary", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const audioFiles = pgTable("audio_file", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .unique()
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  data: bytea("data"),
  createdAt: timestamp("created_at").notNull(),
});

export const quizzes = pgTable("quiz", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  questions: text("questions").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const flashcards = pgTable("flashcard", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  cards: text("cards").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export type Material = typeof materials.$inferSelect;
export type Summary = typeof summaries.$inferSelect;
export type AudioFile = typeof audioFiles.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type FlashcardSet = typeof flashcards.$inferSelect;
