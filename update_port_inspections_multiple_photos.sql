-- Add columns for multiple vehicle photos to port_inspections table
-- This script adds support for storing multiple photos as JSONB arrays

-- Add vehicle_photos column to store multiple photos as JSONB
ALTER TABLE port_inspections 
ADD COLUMN IF NOT EXISTS vehicle_photos JSONB;

-- Add comment to explain the column structure
COMMENT ON COLUMN port_inspections.vehicle_photos IS 'Array of vehicle photos with URLs, descriptions, and filenames stored as JSONB';

-- Create index for better query performance on vehicle_photos
CREATE INDEX IF NOT EXISTS idx_port_inspections_vehicle_photos 
ON port_inspections USING GIN (vehicle_photos);

-- Update existing records to have empty array if vehicle_photos is null
UPDATE port_inspections 
SET vehicle_photos = '[]'::jsonb 
WHERE vehicle_photos IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'port_inspections' 
AND column_name IN ('vehicle_photo_url', 'vehicle_photos')
ORDER BY column_name;
