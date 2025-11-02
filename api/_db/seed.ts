import { db, closeConnection } from "./index.js";
import { plans } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

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
          name: "standard",
          imageGenerationLimit: 60,
          priceMonthly: "5",
          stripePriceId:
            process.env.STRIPE_STANDARD_PRICE_ID ||
            "price_1SON4BLgrX5PSXCRDAQaK9gq",
        },
        {
          name: "pro",
          imageGenerationLimit: 150, // -1 = unlimited
          priceMonthly: "11",
          stripePriceId:
            process.env.STRIPE_PRO_PRICE_ID || "price_1SON4YLgrX5PSXCRLkunuhKk",
        },
      ])
      .onConflictDoNothing();

    const planCount = await db.select().from(plans);
    console.log(`Plans in database: ${planCount.length}`);

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
