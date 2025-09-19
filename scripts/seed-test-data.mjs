import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test data...");

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      id: "mock-user-id",
      email: "test@example.com",
      name: "Test Worker",
    },
  });

  console.log("Created user:", user.email);

  // Create test jobs
  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: "job1" },
      update: {},
      create: {
        id: "job1",
        name: "Building Construction - Phase 1",
        description: "Foundation and framing work",
        location: "Downtown Site A",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        status: "ACTIVE",
      },
    }),
    prisma.job.upsert({
      where: { id: "job2" },
      update: {},
      create: {
        id: "job2",
        name: "Warehouse Renovation",
        description: "Electrical and plumbing updates",
        location: "Industrial Park B",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-08-31"),
        status: "ACTIVE",
      },
    }),
    prisma.job.upsert({
      where: { id: "job3" },
      update: {},
      create: {
        id: "job3",
        name: "Office Complex - Interior",
        description: "Drywall and finishing work",
        location: "Business District C",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-09-30"),
        status: "ACTIVE",
      },
    }),
  ]);

  console.log("Created jobs:", jobs.map(j => j.name));

  // Create crew assignments
  for (const job of jobs) {
    await prisma.crewAssignment.upsert({
      where: {
        jobId_userId: {
          jobId: job.id,
          userId: user.id,
        }
      },
      update: {},
      create: {
        jobId: job.id,
        userId: user.id,
        location: "FIELD",
        status: "ACTIVE",
      },
    });
  }

  console.log("Created crew assignments for test user");

  console.log("Test data seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });