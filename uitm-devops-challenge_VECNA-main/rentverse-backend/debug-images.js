/**
 * Debug script to test property creation with images
 * This will help identify where images are getting lost in the pipeline
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPropertyCreationWithImages() {
  console.log('🔍 Starting property creation with images test...\n');

  try {
    // Step 1: Test image URLs
    console.log('📸 Step 1: Setting up test image URLs...');
    
    const testImageUrl = 'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758300393/rentverse-base/image_15_schljx.png';
    console.log('✅ Test image URL:', testImageUrl);

    // Step 2: Test property creation with images
    console.log('\n🏠 Step 2: Testing property creation with images...');
    
    // Get a sample user for testing
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      throw new Error('No test user found. Please create a test user first.');
    }
    
    console.log('👤 Using test user:', testUser.email);

    // Get a sample property type
    const propertyType = await prisma.propertyType.findFirst();
    if (!propertyType) {
      throw new Error('No property type found. Please check your database.');
    }
    
    console.log('🏢 Using property type:', propertyType.name, '(', propertyType.id, ')');

    // Create test property data with images
    const testPropertyData = {
      code: 'TEST-' + Date.now(),
      title: 'Test Property with Images',
      description: 'This is a test property to debug image storage',
      address: '123 Test Street, Test City',
      city: 'Kuala Lumpur',
      state: 'Selangor',
      zipCode: '50000',
      country: 'MY',
      price: 1500.00,
      currencyCode: 'MYR',
      bedrooms: 2,
      bathrooms: 2,
      areaSqm: 800.50,
      furnished: true,
      isAvailable: true,
      status: 'APPROVED', // Use approved for testing
      images: [
        testImageUrl,
        testImageUrl, // Test with multiple images
        testImageUrl
      ],
      propertyTypeId: propertyType.id,
      latitude: 3.1390,
      longitude: 101.6869,
      amenities: [] // Empty amenities for now
    };

    console.log('\n📋 Property data to be created:');
    console.log(JSON.stringify(testPropertyData, null, 2));

    // Create the property using Prisma directly
    console.log('\n💾 Creating property directly in database...');
    const createdProperty = await prisma.property.create({
      data: {
        code: testPropertyData.code,
        title: testPropertyData.title,
        description: testPropertyData.description,
        address: testPropertyData.address,
        city: testPropertyData.city,
        state: testPropertyData.state,
        zipCode: testPropertyData.zipCode,
        country: testPropertyData.country,
        price: testPropertyData.price,
        currencyCode: testPropertyData.currencyCode,
        bedrooms: testPropertyData.bedrooms,
        bathrooms: testPropertyData.bathrooms,
        areaSqm: testPropertyData.areaSqm,
        furnished: testPropertyData.furnished,
        isAvailable: testPropertyData.isAvailable,
        status: testPropertyData.status,
        images: testPropertyData.images, // This is the key line!
        propertyTypeId: testPropertyData.propertyTypeId,
        ownerId: testUser.id,
        latitude: testPropertyData.latitude,
        longitude: testPropertyData.longitude,
      },
      include: {
        propertyType: true,
        owner: true
      }
    });

    console.log('\n✅ Property created successfully!');
    console.log('Property ID:', createdProperty.id);
    console.log('Property Title:', createdProperty.title);
    console.log('Images count:', createdProperty.images.length);
    console.log('Images:', createdProperty.images);

    // Step 3: Verify the property can be retrieved
    console.log('\n🔍 Step 3: Testing property retrieval...');
    
    const retrievedProperty = await prisma.property.findUnique({
      where: { id: createdProperty.id },
      include: {
        propertyType: true,
        owner: true
      }
    });

    console.log('\n📊 Retrieved property:');
    console.log('ID:', retrievedProperty.id);
    console.log('Title:', retrievedProperty.title);
    console.log('Images count:', retrievedProperty.images.length);
    console.log('Images:', retrievedProperty.images);
    console.log('Property Type:', retrievedProperty.propertyType.name);
    console.log('Owner:', retrievedProperty.owner.email);

    // Step 4: Test through the service layer
    console.log('\n🔧 Step 4: Testing through service layer...');
    
    const propertiesService = require('./src/modules/properties/properties.service');
    
    const serviceProperty = await propertiesService.getPropertyById(createdProperty.id);
    
    console.log('\n📊 Service layer result:');
    console.log('ID:', serviceProperty.id);
    console.log('Title:', serviceProperty.title);
    console.log('Images count:', serviceProperty.images?.length || 0);
    console.log('Images:', serviceProperty.images);

    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('===================');
    
    if (createdProperty.images.length > 0) {
      console.log('✅ Images were successfully stored in database!');
      console.log('📸 Stored', createdProperty.images.length, 'images');
      
      if (serviceProperty.images && serviceProperty.images.length > 0) {
        console.log('✅ Images are also accessible through service layer!');
      } else {
        console.log('❌ Images are NOT accessible through service layer!');
        console.log('💡 Issue might be in service layer processing');
      }
    } else {
      console.log('❌ No images were stored in database!');
      console.log('💡 Issue is in the database creation step');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.property.delete({
      where: { id: createdProperty.id }
    });
    console.log('✅ Test property deleted');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPropertyCreationWithImages();