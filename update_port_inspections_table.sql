-- Add Google Drive URL column to port_inspections table
ALTER TABLE port_inspections 
ADD COLUMN google_drive_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN port_inspections.google_drive_url IS 'URL to the image file stored in Google Drive';
