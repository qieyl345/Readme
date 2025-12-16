const { prisma } = require('./src/config/database');

async function addMissingProperty() {
  console.log('🔧 Adding missing property to fix 404 error...');

  try {
    // Check if property already exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: 'b6b7e0fb-983e-4af3-a0d4-4d0761e29fc1' }
    });

    if (existingProperty) {
      console.log('✅ Property already exists!');
      return;
    }

    // Get a landlord user
    const landlord = await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    if (!landlord) {
      throw new Error('No landlord user found. Please run user seeder first.');
    }

    // Get a property type
    const propertyType = await prisma.propertyType.findFirst();
    
    if (!propertyType) {
      throw new Error('No property type found. Please run property type seeder first.');
    }

    // Create the missing property
    const property = await prisma.property.create({
      data: {
        id: 'b6b7e0fb-983e-4af3-a0d4-4d0761e29fc1', // Exact ID from frontend
        title: 'Modern Luxury Apartment in KLCC',
        description: 'Stunning 2-bedroom luxury apartment in the heart of Kuala Lumpur City Centre. Features panoramic city views, premium finishes, and world-class amenities including infinity pool, gym, and 24-hour concierge service.',
        address: 'Jalan Pinang, KLCC',
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur',
        zipCode: '50088',
        price: 6500.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 120.0,
        code: 'PROP-KLCC-001-FIX',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 3.1578,
        longitude: 101.7118,
        ownerId: landlord.id,
        propertyTypeId: propertyType.id,
        status: 'APPROVED',
        isAvailable: true,
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1560449752-6bb5e20a4e36?w=800',
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',
          'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
        ],
        viewCount: 156,
        favoriteCount: 23,
        averageRating: 4.8,
        totalRatings: 12
      }
    });

    console.log('✅ Successfully added missing property!');
    console.log(`   Property ID: ${property.id}`);
    console.log(`   Title: ${property.title}`);
    console.log(`   Location: ${property.city}, ${property.state}`);
    console.log(`   Price: RM${property.price}/month`);

    // Add some amenities
    const amenities = await prisma.amenity.findMany({
      take: 3
    });

    if (amenities.length > 0) {
      const propertyAmenities = amenities.map(amenity => ({
        propertyId: property.id,
        amenityId: amenity.id
      }));

      await prisma.propertyAmenity.createMany({
        data: propertyAmenities,
        skipDuplicates: true
      });

      console.log(`✅ Added ${propertyAmenities.length} amenities to the property`);
    }

  } catch (error) {
    console.error('❌ Error adding missing property:', error);
    throw error;
  }
}

// Run the function
addMissingProperty()
  .then(async () => {
    console.log('\n🎉 Property fix completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Property fix failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });