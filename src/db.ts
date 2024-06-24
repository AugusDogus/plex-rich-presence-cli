import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

export const connection = new Database("sqlite.db");
export const db = drizzle(connection, { schema });
