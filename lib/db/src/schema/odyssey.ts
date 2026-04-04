import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const learnersTable = pgTable("learners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthday: text("birthday").notNull(),
  diagnosis: text("diagnosis"),
  therapies: jsonb("therapies").$type<string[]>().default([]),
  school: text("school"),
  class: text("class"),
  capabilities: jsonb("capabilities").$type<string[]>().default([]),
  interests: jsonb("interests").$type<string[]>().default([]),
  favorites: jsonb("favorites").$type<string[]>().default([]),
  challenges: jsonb("challenges").$type<string[]>().default([]),
  learningGoals: jsonb("learning_goals").$type<string[]>().default([]),
  longTermGoals: jsonb("long_term_goals").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adventuresTable = pgTable("adventures", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  coinsPerStep: integer("coins_per_step").default(2).notNull(),
  completionBonus: integer("completion_bonus").default(5).notNull(),
  isTemplate: boolean("is_template").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stepsTable = pgTable("steps", {
  id: serial("id").primaryKey(),
  adventureId: integer("adventure_id")
    .notNull()
    .references(() => adventuresTable.id, { onDelete: "cascade" }),
  instruction: text("instruction").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type").$type<"image" | "video">(),
  thumbnail: text("thumbnail"),
  tip: text("tip"),
  order: integer("order").notNull(),
});

export const walletsTable = pgTable("wallets", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" })
    .unique(),
  coins: integer("coins").default(0).notNull(),
  lifetimeCoins: integer("lifetime_coins").default(0).notNull(),
});

export const rewardsTable = pgTable("rewards", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  cost: integer("cost").notNull(),
  cooldown: integer("cooldown").default(0),
  redeemed: boolean("redeemed").default(false),
  startDate: text("start_date"),
  endDate: text("end_date"),
  timeWindow: text("time_window"),
  linkedAdventures: jsonb("linked_adventures").$type<number[]>().default([]),
  isDraft: boolean("is_draft").default(false).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  isTemplate: boolean("is_template").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" }),
  type: text("type").$type<"earn" | "redeem">().notNull(),
  amount: integer("amount").notNull(),
  source: text("source").$type<"step" | "completion" | "reward">().notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const performanceTrackingTable = pgTable("performance_tracking", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" }),
  stepId: integer("step_id").references(() => stepsTable.id),
  adventureId: integer("adventure_id").references(() => adventuresTable.id),
  completionTime: integer("completion_time"),
  attempts: integer("attempts").default(1).notNull(),
  success: boolean("success").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voyagePathsTable = pgTable("voyage_paths", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  adventureIds: jsonb("adventure_ids").$type<number[]>().default([]),
  rewardIds: jsonb("reward_ids").$type<number[]>().default([]),
  startDate: text("start_date"),
  endDate: text("end_date"),
  frequency: text("frequency").$type<"daily" | "weekly">().default("daily"),
  visibility: text("visibility").$type<"public" | "private">().default("private"),
  commentsEnabled: boolean("comments_enabled").default(true),
  status: text("status").$type<"draft" | "active" | "completed">().default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voyageLogsTable = pgTable("voyage_logs", {
  id: serial("id").primaryKey(),
  voyagePathId: integer("voyage_path_id")
    .notNull()
    .references(() => voyagePathsTable.id, { onDelete: "cascade" }),
  adventureId: integer("adventure_id").references(() => adventuresTable.id),
  learnerId: integer("learner_id")
    .notNull()
    .references(() => learnersTable.id, { onDelete: "cascade" }),
  completionStatus: text("completion_status")
    .$type<"in_progress" | "completed" | "skipped">()
    .default("in_progress")
    .notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type").$type<"image" | "video">(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLearnerSchema = createInsertSchema(learnersTable).omit({
  id: true,
  createdAt: true,
});
export const insertAdventureSchema = createInsertSchema(adventuresTable).omit({
  id: true,
  createdAt: true,
});
export const insertStepSchema = createInsertSchema(stepsTable).omit({
  id: true,
});
export const insertRewardSchema = createInsertSchema(rewardsTable).omit({
  id: true,
});
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertPerformanceSchema = createInsertSchema(
  performanceTrackingTable,
).omit({ id: true, createdAt: true });

export const insertVoyagePathSchema = createInsertSchema(voyagePathsTable).omit({
  id: true,
  createdAt: true,
});
export const insertVoyageLogSchema = createInsertSchema(voyageLogsTable).omit({
  id: true,
  createdAt: true,
});

export type Learner = typeof learnersTable.$inferSelect;
export type Adventure = typeof adventuresTable.$inferSelect;
export type Step = typeof stepsTable.$inferSelect;
export type Wallet = typeof walletsTable.$inferSelect;
export type Reward = typeof rewardsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type PerformanceTracking = typeof performanceTrackingTable.$inferSelect;
export type VoyagePath = typeof voyagePathsTable.$inferSelect;
export type VoyageLog = typeof voyageLogsTable.$inferSelect;

export type InsertLearner = z.infer<typeof insertLearnerSchema>;
export type InsertAdventure = z.infer<typeof insertAdventureSchema>;
export type InsertStep = z.infer<typeof insertStepSchema>;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type InsertVoyagePath = z.infer<typeof insertVoyagePathSchema>;
export type InsertVoyageLog = z.infer<typeof insertVoyageLogSchema>;
