import { prisma } from "./prisma";

export async function seedTestJobs() {
  try {
    // Create test jobs
    const job1 = await prisma.job.create({
      data: {
        name: "Downtown Office Complex",
        description: "Steel framing and electrical installation for new office building",
        location: "123 Main St, Downtown",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        status: "ACTIVE"
      }
    });

    const job2 = await prisma.job.create({
      data: {
        name: "Harbor Bridge Repair",
        description: "Structural repairs and repainting of harbor bridge",
        location: "Harbor Bridge, Waterfront",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-08-15"),
        status: "ACTIVE"
      }
    });

    const job3 = await prisma.job.create({
      data: {
        name: "Residential Development Phase 2",
        description: "Foundation and framing work for residential units",
        location: "Meadowbrook Subdivision",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-12-31"),
        status: "ACTIVE"
      }
    });

    console.log("✅ Test jobs created successfully:");
    console.log(`- ${job1.name} (${job1.id})`);
    console.log(`- ${job2.name} (${job2.id})`);
    console.log(`- ${job3.name} (${job3.id})`);

    return { job1, job2, job3 };
  } catch (error) {
    console.error("❌ Error seeding test jobs:", error);
    throw error;
  }
}