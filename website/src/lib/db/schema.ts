import { uuid, integer, pgTable, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export * from "./auth-schema";
import { users } from "./auth-schema";

export const tabs = pgTable("tabs", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

  owner: text("owner").notNull().references(() => users.id),
  name: text("name").notNull(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

  owner: text("owner").notNull().references(() => users.id),
  tab: uuid("tab_id").notNull().references(() => tabs.id),
  name: text("name").notNull(),
  mime_type: text("mime_type"),
  size_bytes: integer("size_bytes").notNull(),

  location: text("location"),
});
