import { db, closeConnection } from "./index";
import { plans } from "./schema";

async function seed() {
  console.log("⏳ Seeding database...");

  try {
    // Insert default plans
    await db
      .insert(plans)
      .values([
        {
          name: "free",
          imageGenerationLimit: 10,
          priceMonthly: "0",
          stripePriceId: null,
        },
        {
          name: "pro",
          imageGenerationLimit: 100,
          priceMonthly: "9.99",
          stripePriceId: null, // Add real Stripe price ID later
        },
        {
          name: "enterprise",
          imageGenerationLimit: -1, // -1 = unlimited
          priceMonthly: "29.99",
          stripePriceId: null, // Add real Stripe price ID later
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed!");
    console.error(error);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
}

seed();
