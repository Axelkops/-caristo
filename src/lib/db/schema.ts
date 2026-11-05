import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

/** Un rapport = une commande pour un véhicule. */
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  shareToken: text("share_token").notNull().unique(),
  /** draft | identified | awaiting_payment | paid | generating | ready | failed | refunded */
  status: text("status").notNull().default("draft"),
  inputKind: text("input_kind").notNull(), // plate | vin
  inputValue: text("input_value").notNull(),
  country: text("country").notNull().default("FR"),
  mileage: integer("mileage"),
  holderName: text("holder_name"),
  formulaNumber: text("formula_number"),
  firstRegDate: text("first_reg_date"),
  listingUrl: text("listing_url"),
  listingPrice: integer("listing_price"),
  email: text("email"),
  offer: text("offer").notNull().default("single"), // single | pack3 | pack10
  packId: text("pack_id"),
  vehicle: jsonb("vehicle"),
  report: jsonb("report"),
  score: text("score"),
  stripeSessionId: text("stripe_session_id").unique(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  readyAt: timestamp("ready_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Un pack de crédits (3 ou 10 rapports). */
export const packs = pgTable("packs", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  email: text("email").notNull(),
  offer: text("offer").notNull(), // pack3 | pack10
  creditsTotal: integer("credits_total").notNull(),
  creditsUsed: integer("credits_used").notNull().default(0),
  stripeSessionId: text("stripe_session_id").unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Carnet d'entretien : une ligne par facture / contrôle / rappel. */
export const maintenanceEntries = pgTable("maintenance_entries", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  mileage: integer("mileage"),
  label: text("label").notNull(),
  cost: integer("cost"),
  kind: text("kind").notNull().default("invoice"), // invoice | inspection | recall | note
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Cache des appels fournisseurs (rappels, fiche technique). */
export const providerCache = pgTable("provider_cache", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type ReportRow = typeof reports.$inferSelect;
export type PackRow = typeof packs.$inferSelect;
export type MaintenanceEntryRow = typeof maintenanceEntries.$inferSelect;

/** Codes de connexion à 6 chiffres envoyés par e-mail (valables 10 minutes). */
export const loginCodes = pgTable("login_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Sessions « Mes rapports » (cookie), 90 jours. */
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
