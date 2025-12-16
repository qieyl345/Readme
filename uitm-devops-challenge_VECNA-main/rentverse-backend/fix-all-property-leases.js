const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllPropertyDeletions() {
  console.log('🔧 Fixing foreign key constraint violations for all properties with leases...');

  try {
    // Find all properties that have leases
    const propertiesWithLeases = await prisma.property.findMany({
      where: {
        leases: {
          some: {}, // Has at least one lease
        },
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            leases: true,
          },
        },
      },
    });

    console.log(`📊 Found ${propertiesWithLeases.length} properties with leases.`);

    let totalLeasesDeleted = 0;

    for (const property of propertiesWithLeases) {
      console.log(`Deleting ${property._count.leases} lease(s) for property: ${property.title} (${property.id})`);

      const deletedLeases = await prisma.lease.deleteMany({
        where: {
          propertyId: property.id,
        },
      });

      totalLeasesDeleted += deletedLeases.count;
    }

    console.log(`✅ Total leases deleted: ${totalLeasesDeleted}`);
    console.log('🎉 All properties can now be deleted without foreign key violations!');

  } catch (error) {
    console.error('❌ Error fixing property deletions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllPropertyDeletions();