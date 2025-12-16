const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Coordinate mapping for Malaysian states
const STATE_COORDINATES = {
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Selangor': { lat: 3.0738, lng: 101.5183 },
  'Penang': { lat: 5.4141, lng: 100.3288 },
  'Johor': { lat: 1.4927, lng: 103.7414 },
  'Putrajaya': { lat: 2.9264, lng: 101.6964 },
  'Melaka': { lat: 2.1896, lng: 102.2501 },
  'Negeri Sembilan': { lat: 2.7258, lng: 101.9424 },
  'Pahang': { lat: 3.8126, lng: 103.3256 },
  'Perak': { lat: 4.5921, lng: 101.0901 },
  'Perlis': { lat: 6.4449, lng: 100.2048 },
  'Sabah': { lat: 5.9788, lng: 116.0753 },
  'Sarawak': { lat: 1.5533, lng: 110.3592 },
  'Terengganu': { lat: 5.3117, lng: 103.1324 },
  'Kedah': { lat: 6.1184, lng: 100.3685 },
  'Kelantan': { lat: 6.1254, lng: 102.2381 },
  'Labuan': { lat: 5.2831, lng: 115.2308 },
};

// Helper to clean price strings (e.g. "RM 1,200" -> 1200)
const cleanPrice = (priceStr) => {
  if (!priceStr) return 0;
  return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
};

// Helper to clean area strings (e.g. "800 sqft" -> 800)
const cleanArea = (areaStr) => {
  if (!areaStr) return 0;
  return parseFloat(areaStr.replace(/[^0-9.]/g, ''));
};

async function main() {
  console.log('🚀 Starting property import...');

  // 1. Locate the CSV file
  // Assuming the CSV is in the rentverse-datasets folder relative to backend
  const csvPath = path.join(__dirname, '../../../rentverse-datasets/rentals_raw.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    console.error('Please run the scraper first: cd rentverse-datasets && scrapy crawl ...');
    process.exit(1);
  }

  // 2. Read and parse CSV
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`📊 Found ${records.length} records to process.`);

  // 3. Ensure we have a property type for "Condominium"
  const propType = await prisma.propertyType.upsert({
    where: { code: 'CONDO' },
    update: {},
    create: { code: 'CONDO', name: 'Condominium', description: 'High-rise apartment' },
  });

  // 4. Ensure we have an Admin user to own these properties
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    console.error('❌ No ADMIN user found. Please create one first via Prisma Studio.');
    process.exit(1);
  }

  // 5. Process each record
  let count = 0;
  for (const row of records) {
    try {
      // Determine coordinates
      // The CSV has a 'location' column which usually contains the state or city
      let lat = 3.1390; // Default KL
      let lng = 101.6869;

      // Try to find matching state in location string
      for (const [state, coords] of Object.entries(STATE_COORDINATES)) {
        if (row.location && row.location.includes(state)) {
          // Add a small random jitter so markers don't stack perfectly on top of each other
          lat = coords.lat + (Math.random() - 0.5) * 0.05;
          lng = coords.lng + (Math.random() - 0.5) * 0.05;
          break;
        }
      }

      // Prepare images array
      const images = row.images ? row.images.split(',').filter(url => url.length > 0) : [];

      // --- THIS IS THE UPDATED PART ---
      await prisma.property.upsert({
        where: {
          code: `FAZ-${row.listing_id || Math.floor(Math.random() * 100000)}`,
        },
        update: {
          // This block will update existing properties
          latitude: lat,
          longitude: lng,
          images: images, // Also update images for existing properties
        },
        create: {
          // This block will create new properties if they don't exist
          title: row.title || 'Untitled Property',
          description: row.description?.substring(0, 500) || '',
          address: row.location || 'Unknown Address',
          city: row.location?.split(',')[0] || 'Kuala Lumpur',
          state: 'Kuala Lumpur', // Simplified, ideally parse from location
          zipCode: '50000',
          country: 'MY',
          price: cleanPrice(row.price),
          currencyCode: 'MYR',
          bedrooms: parseInt(row.bedrooms) || 1,
          bathrooms: parseInt(row.bathrooms) || 1,
          areaSqm: cleanArea(row.area) * 0.092903, // Convert sqft to sqm
          furnished: row.furnished?.toLowerCase() === 'yes',
          isAvailable: true,
          images: images,
          latitude: lat,
          longitude: lng,
          code: `FAZ-${row.listing_id || Math.floor(Math.random() * 100000)}`,
          status: 'APPROVED',
          ownerId: adminUser.id,
          propertyTypeId: propType.id,
        },
      });
      // --- END OF UPDATED PART ---
      
      count++;
      if (count % 50 === 0) console.log(`✅ Updated ${count} properties...`);

    } catch (err) {
      // Log any other errors
      console.warn(`⚠️ Failed to process row: ${err.message}`);
    }
  }

  console.log(`🎉 Import complete! Successfully updated ${count} properties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });