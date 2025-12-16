-- Fix foreign key constraint violation for property deletion
-- This script deletes leases that reference the property before deleting the property

-- Delete leases for the specific property
DELETE FROM leases WHERE "propertyId" = '05259067-3232-4f61-ad62-31fc12f447ca';

-- Now you can safely delete the property
-- DELETE FROM properties WHERE id = '05259067-3232-4f61-ad62-31fc12f447ca';