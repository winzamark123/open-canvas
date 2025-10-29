import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  decimal,
  text,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - synced from Clerk
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription plans
export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  imageGenerationLimit: integer("image_generation_limit").notNull(),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
});

// User subscriptions
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
);

// Image logs tracking (generations and edits)
export const imageLogs = pgTable(
  "image_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userTypeCreatedIdx: index("user_type_created_idx").on(
      table.userId,
      table.type,
      table.createdAt,
    ),
  }),
);

// Relations for easier querying
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(userSubscriptions),
  imageLogs: many(imageLogs),
}));

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id],
    }),
    plan: one(plans, {
      fields: [userSubscriptions.planId],
      references: [plans.id],
    }),
  }),
);

export const imageLogsRelations = relations(imageLogs, ({ one }) => ({
  user: one(users, {
    fields: [imageLogs.userId],
    references: [users.id],
  }),
}));
