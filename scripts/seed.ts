import { seedTestJobs } from "../src/lib/seed-data";

async function main() {
  try {
    console.log("🌱 Seeding database with test data...");
    await seedTestJobs();
    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();