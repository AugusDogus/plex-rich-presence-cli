import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const servers = sqliteTable("servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uri: text("uri"),
  guid: text("guid"),
  active: integer("active", { mode: "boolean" }),
});

export const playback = sqliteTable("playback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  guid: text("guid"),
  grandparentTitle: text("grandparentTitle"),
  parentTitle: text("parentTitle"),
  index: integer("index"),
});
