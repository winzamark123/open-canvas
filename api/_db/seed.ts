import { db, closeConnection } from "./index.js";
import { plans } from "./schema.js";

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
          stripePriceId:
            process.env.NODE_ENV === "production"
              ? null
              : "price_1SN4FgLgrX5PSXCR5KGaPth4", // Add real Stripe price ID later
        },
        {
          name: "standard",
          imageGenerationLimit: 60,
          priceMonthly: "5",
          stripePriceId:
            process.env.NODE_ENV === "production"
              ? null
              : "price_1SMDNHLgrX5PSXCRdSqJn1D3", // Add real Stripe price ID later
        },
        {
          name: "pro",
          imageGenerationLimit: 150, // -1 = unlimited
          priceMonthly: "11",
          stripePriceId:
            process.env.NODE_ENV === "production"
              ? null
              : "price_1SMDNHLgrX5PSXCRnsoQ25a8", // Add real Stripe price ID later
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
