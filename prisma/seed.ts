import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users
  const testUser1 = await prisma.user.upsert({
    where: { email: "foreman@construction.com" },
    update: {},
    create: {
      email: "foreman@construction.com",
      name: "John Foreman",
      role: "FOREMAN",
      location: "Downtown Office",
    },
  });

  const testUser2 = await prisma.user.upsert({
    where: { email: "field@construction.com" },
    update: {},
    create: {
      email: "field@construction.com",
      name: "Mike Field",
      role: "FIELD",
      location: "Construction Site A",
    },
  });

  const testUser3 = await prisma.user.upsert({
    where: { email: "pm@construction.com" },
    update: {},
    create: {
      email: "pm@construction.com",
      name: "Sarah Manager",
      role: "PM",
      location: "Main Office",
    },
  });

  // Create test jobs
  const job1 = await prisma.job.upsert({
    where: { id: "test-job-1" },
    update: {},
    create: {
      id: "test-job-1",
      name: "downtown-office-renovation",
      title: "Downtown Office Renovation",
      client: "ABC Corporation",
      description: "Complete renovation of the downtown office building",
      location: "123 Main Street, Downtown",
      status: "ACTIVE",
      priority: "high",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-06-30"),
    },
  });

  const job2 = await prisma.job.upsert({
    where: { id: "test-job-2" },
    update: {},
    create: {
      id: "test-job-2",
      name: "warehouse-construction",
      title: "New Warehouse Construction",
      client: "XYZ Logistics",
      description: "Construction of a new 50,000 sq ft warehouse",
      location: "Industrial Park, Zone B",
      status: "ACTIVE",
      priority: "medium",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-08-15"),
    },
  });

  // Add users to jobs
  const jobMemberships = [
    { jobId: job1.id, userId: testUser1.id, role: "supervisor" },
    { jobId: job1.id, userId: testUser2.id, role: "member" },
    { jobId: job1.id, userId: testUser3.id, role: "admin" },
    { jobId: job2.id, userId: testUser1.id, role: "supervisor" },
    { jobId: job2.id, userId: testUser2.id, role: "member" },
  ];

  for (const membership of jobMemberships) {
    await prisma.jobMember.upsert({
      where: {
        jobId_userId: {
          jobId: membership.jobId,
          userId: membership.userId,
        },
      },
      update: {},
      create: membership,
    });
  }

  // Create some test messages
  const testMessages = [
    {
      content: "Good morning team! Ready to start work on the downtown renovation project.",
      senderId: testUser1.id,
      jobId: job1.id,
      type: "text",
    },
    {
      content: "Materials arrived on site. Everything looks good!",
      senderId: testUser2.id,
      jobId: job1.id,
      type: "text",
    },
    {
      content: "Great! Let's review the schedule at 2 PM today.",
      senderId: testUser3.id,
      jobId: job1.id,
      type: "text",
    },
    {
      content: "Starting foundation work at the warehouse site today.",
      senderId: testUser2.id,
      jobId: job2.id,
      type: "text",
    },
    {
      content: "Weather looks good for the next few days. Perfect for concrete work.",
      senderId: testUser1.id,
      jobId: job2.id,
      type: "text",
    },
  ];

  for (const message of testMessages) {
    await prisma.message.create({
      data: message,
    });
  }

  // Create additional users for crew testing
  const shopWorker1 = await prisma.user.upsert({
    where: { email: "shop1@construction.com" },
    update: {},
    create: {
      email: "shop1@construction.com",
      name: "Tom Shop",
      role: "FIELD",
      location: "Fabrication Shop",
    },
  });

  const shopWorker2 = await prisma.user.upsert({
    where: { email: "shop2@construction.com" },
    update: {},
    create: {
      email: "shop2@construction.com",
      name: "Alex Welder",
      role: "FIELD",
      location: "Fabrication Shop",
    },
  });

  const fieldWorker3 = await prisma.user.upsert({
    where: { email: "field3@construction.com" },
    update: {},
    create: {
      email: "field3@construction.com",
      name: "Bob Builder",
      role: "FIELD",
      location: "Various Sites",
    },
  });

  // Create crews
  const fieldCrew1 = await prisma.crew.upsert({
    where: { id: "field-crew-1" },
    update: {},
    create: {
      id: "field-crew-1",
      name: "Alpha Field Crew",
      type: "FIELD",
      foremanId: testUser1.id,
      active: true,
    },
  });

  const fieldCrew2 = await prisma.crew.upsert({
    where: { id: "field-crew-2" },
    update: {},
    create: {
      id: "field-crew-2",
      name: "Bravo Field Crew",
      type: "FIELD",
      active: true,
    },
  });

  const shopCrew = await prisma.crew.upsert({
    where: { id: "shop-crew-1" },
    update: {},
    create: {
      id: "shop-crew-1",
      name: "Fabrication Shop Crew",
      type: "SHOP",
      active: true,
    },
  });

  // Add crew members
  const crewMembers = [
    { crewId: fieldCrew1.id, userId: testUser2.id },
    { crewId: fieldCrew1.id, userId: fieldWorker3.id },
    { crewId: fieldCrew2.id, userId: fieldWorker3.id },
    { crewId: shopCrew.id, userId: shopWorker1.id },
    { crewId: shopCrew.id, userId: shopWorker2.id },
  ];

  for (const member of crewMembers) {
    await prisma.crewMember.upsert({
      where: {
        crewId_userId: {
          crewId: member.crewId,
          userId: member.userId,
        },
      },
      update: {},
      create: {
        crewId: member.crewId,
        userId: member.userId,
        active: true,
      },
    });
  }

  // Create crew assignments
  const assignments = [
    { jobId: job1.id, crewId: fieldCrew1.id, location: "FIELD" },
    { jobId: job2.id, crewId: shopCrew.id, location: "SHOP" },
  ];

  for (const assignment of assignments) {
    await prisma.crewAssignment.upsert({
      where: {
        jobId_crewId: {
          jobId: assignment.jobId,
          crewId: assignment.crewId,
        },
      },
      update: {},
      create: {
        jobId: assignment.jobId,
        crewId: assignment.crewId,
        location: assignment.location,
        active: true,
      },
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`👤 Created users: ${testUser1.name}, ${testUser2.name}, ${testUser3.name}, ${shopWorker1.name}, ${shopWorker2.name}, ${fieldWorker3.name}`);
  console.log(`🏗️ Created jobs: ${job1.title}, ${job2.title}`);
  console.log("💬 Created test messages for both jobs");
  console.log("👥 Created 3 crews with assignments: Alpha Field Crew (assigned), Bravo Field Crew (available), Fabrication Shop Crew (assigned)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });