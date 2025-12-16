import pandas as pd
import psycopg2
import os
import uuid
import re
from dotenv import load_dotenv

# Ambil konfigurasi database dari .env backend anda
load_dotenv(dotenv_path='../rentverse-backend/.env')

DB_URL = os.getenv('DATABASE_URL')
if not DB_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

def parse_db_url(url):
    """Parse DATABASE_URL to get required PostgreSQL connection parameters."""
    result = re.search(r"postgresql://(.+):(.+)@(.+):(\d+)/(.+)\?.*", url)
    if not result:
        # Fallback for simpler connection strings without params
        result = re.search(r"postgresql://(.+):(.+)@(.+):(\d+)/(.+)", url)
    
    if not result:
        raise ValueError("Invalid DATABASE_URL format.")
        
    return {
        "user": result.group(1),
        "password": result.group(2),
        "host": result.group(3),
        "port": result.group(4),
        "database": result.group(5),
    }

def clean_price(price_str):
    """Remove 'RM', commas, and whitespace from price string."""
    if pd.isna(price_str):
        return 0.0
    # Remove 'RM', commas, and extra spaces
    clean_str = str(price_str).replace('RM', '').replace(',', '').strip()
    try:
        return float(clean_str)
    except ValueError:
        return 0.0

def clean_area(area_str):
    """Remove 'Sqft', commas, and whitespace from area string."""
    if pd.isna(area_str):
        return 0.0
    # Remove 'Sqft', commas, and extra spaces (case insensitive)
    clean_str = str(area_str).lower().replace('sqft', '').replace(',', '').strip()
    try:
        return float(clean_str)
    except ValueError:
        return 0.0

def seed_data():
    if not os.path.exists("rentals_raw.csv"):
        print("❌ Error: 'rentals_raw.csv' not found. Please run Scrapy crawl first.")
        return

    db_params = parse_db_url(DB_URL)
    conn = None
    
    try:
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        
        df = pd.read_csv("rentals_raw.csv")
        print(f"📊 Loaded {len(df)} rows from CSV.")

        # --- FIX: AUTO-CREATE PROPERTY TYPE 'CONDO' ---
        print("🔍 Checking for Property Type 'CONDO'...")
        cur.execute("SELECT id FROM property_types WHERE code = 'CONDO' LIMIT 1;")
        result = cur.fetchone()
        
        if not result:
            print("⚠️ 'CONDO' type not found. Creating it automatically...")
            property_type_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO property_types (id, code, name, description, "createdAt", "updatedAt")
                VALUES (%s, 'CONDO', 'Condominium', 'High-rise apartment complex', NOW(), NOW())
            """, (property_type_id,))
            print("✅ Created Property Type: CONDO")
        else:
            property_type_id = result[0]
            print("✅ Found existing Property Type: CONDO")
        # ---------------------------------------------

        # --- FIX: AUTO-DETECT OR CREATE ADMIN OWNER ---
        print("🔍 Checking for ADMIN user...")
        cur.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;")
        result = cur.fetchone()
        
        if not result:
            print("⚠️ No ADMIN user found. Searching for ANY user to be the owner...")
            cur.execute("SELECT id FROM users LIMIT 1;")
            result = cur.fetchone()
            
            if not result:
                 raise ValueError("❌ No users found in database. Please Register a user on the website first!")
            
            owner_id = result[0]
            print(f"⚠️ Using existing User ID {owner_id} as property owner (Not Admin).")
        else:
            owner_id = result[0]
            print(f"✅ Found ADMIN user ID: {owner_id}")
        # ---------------------------------------------

        # START SEEDING PROPERTIES
        print("🚀 Starting data injection...")
        count = 0
        for index, row in df.iterrows():
            property_id = str(uuid.uuid4())
            property_code = f"FAZ-{row['listing_id']}"
            
            # Hanya ambil 200 karakter pertama description
            description = str(row['description'])[:200]
            
            # Bersihkan format imej
            raw_images = str(row['images'])
            if raw_images and raw_images != 'nan':
                 # PostgreSQL array literal format: {"url1", "url2"}
                 images_list = [url.strip() for url in raw_images.split('|') if url.strip()]
                 # Escape double quotes if any, wrap in double quotes
                 images_content = ",".join(f'"{img}"' for img in images_list)
                 images_array = f"{{{images_content}}}"
            else:
                 images_array = "{}"

            # Clean price and area before inserting
            price_value = clean_price(row['price'])
            area_sqft = clean_area(row['area'])
            area_sqm = area_sqft * 0.092903 # Convert sqft to sqm

            # Masukkan data ke table properties
            # Note: We quote column names to preserve camelCase from Prisma schema
            cur.execute("""
                INSERT INTO properties (id, title, description, address, city, state, "zipCode", country, price, "currencyCode", bedrooms, bathrooms, "areaSqm", furnished, "isAvailable", images, "ownerId", "propertyTypeId", code, status, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (code) DO NOTHING;
            """, (
                property_id, row['title'], description, row['location'], row['location'], 'Kuala Lumpur', '50000', 'MY',
                price_value, 'MYR', int(row['bedrooms'] or 0), int(row['bathrooms'] or 0), area_sqm,
                str(row['furnished']).lower() == 'yes', True, images_array, owner_id, property_type_id, property_code, 'APPROVED'
            ))
            count += 1

        conn.commit()
        print(f"✅ Seeding complete! Processed {count} properties.")
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    seed_data()