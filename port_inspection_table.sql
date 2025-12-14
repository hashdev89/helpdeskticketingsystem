-- Port Inspection Table Creation Script
-- This table stores all port inspection data from the form

CREATE TABLE port_inspections (
    id SERIAL PRIMARY KEY,
    
    -- Vehicle Information
    code_no VARCHAR(100),
    make VARCHAR(100),
    location VARCHAR(255),
    colour VARCHAR(100),
    fuel VARCHAR(50),
    chassis_no VARCHAR(100),
    mileage VARCHAR(50),
    engine_no VARCHAR(100),
    no_of_doors INTEGER,
    fuel_level VARCHAR(20),
    vehicle_photo_url TEXT,
    
    -- Checklist Items (stored as JSON for flexibility)
    checklist_data JSONB,
    
    -- Tyre Condition Data (stored as JSON for flexibility)
    tyre_data JSONB,
    
    -- Signatures Data (stored as JSON for flexibility)
    signatures_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Additional fields for tracking
    inspection_date DATE,
    inspector_name VARCHAR(255),
    notes TEXT,
    
    -- Indexes for better performance
    CONSTRAINT idx_port_inspections_code_no UNIQUE (code_no),
    CONSTRAINT idx_port_inspections_chassis_no UNIQUE (chassis_no)
);

-- Create indexes for better query performance
CREATE INDEX idx_port_inspections_created_at ON port_inspections(created_at);
CREATE INDEX idx_port_inspections_status ON port_inspections(status);
CREATE INDEX idx_port_inspections_inspection_date ON port_inspections(inspection_date);
CREATE INDEX idx_port_inspections_checklist_data ON port_inspections USING GIN (checklist_data);
CREATE INDEX idx_port_inspections_tyre_data ON port_inspections USING GIN (tyre_data);
CREATE INDEX idx_port_inspections_signatures_data ON port_inspections USING GIN (signatures_data);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_port_inspections_updated_at 
    BEFORE UPDATE ON port_inspections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Example of how the JSONB data would be structured:

-- Checklist Data Structure Example:
/*
{
  "items": [
    {
      "id": 1,
      "description": "Side Mirrors",
      "note": "Good condition",
      "qt": "2"
    },
    {
      "id": 2,
      "description": "Air Condition",
      "airCondition": "Yes",
      "qt": "1"
    },
    {
      "id": 3,
      "description": "Horn",
      "horn": "Yes",
      "qt": "1"
    }
    -- ... more items
  ]
}
*/

-- Tyre Data Structure Example:
/*
{
  "frontRight": {
    "type": "Michelin 205/55R16",
    "wear": "Good"
  },
  "frontLeft": {
    "type": "Michelin 205/55R16",
    "wear": "Good"
  },
  "rearRight": {
    "type": "Michelin 205/55R16",
    "wear": "Fair"
  },
  "rearLeft": {
    "type": "Michelin 205/55R16",
    "wear": "Fair"
  },
  "spareTyre": {
    "type": "Michelin 205/55R16",
    "wear": "New"
  }
}
*/

-- Signatures Data Structure Example:
/*
{
  "portInspectionOfficer": {
    "name": "John Doe",
    "signature": "John Doe",
    "date": "2024-01-15"
  },
  "signature1": {
    "name": "Jane Smith",
    "signature": "Jane Smith",
    "date": "2024-01-15"
  },
  "signature2": {
    "name": "Bob Johnson",
    "signature": "Bob Johnson",
    "date": "2024-01-15"
  },
  "signature3": {
    "name": "Alice Brown",
    "signature": "Alice Brown",
    "date": "2024-01-15"
  }
}
*/

-- Insert example data
INSERT INTO port_inspections (
    code_no,
    make,
    location,
    colour,
    fuel,
    chassis_no,
    mileage,
    engine_no,
    no_of_doors,
    fuel_level,
    checklist_data,
    tyre_data,
    signatures_data,
    created_by,
    inspection_date,
    inspector_name,
    notes
) VALUES (
    'PI-2024-001',
    'Toyota',
    'Port of Colombo',
    'White',
    'Petrol',
    'JTDKN3DU0E1234567',
    '50000',
    '2ZR-FE123456',
    4,
    '¾',
    '{"items": [{"id": 1, "description": "Side Mirrors", "note": "Good condition", "qt": "2"}, {"id": 2, "description": "Air Condition", "airCondition": "Yes", "qt": "1"}]}',
    '{"frontRight": {"type": "Michelin 205/55R16", "wear": "Good"}, "frontLeft": {"type": "Michelin 205/55R16", "wear": "Good"}}',
    '{"portInspectionOfficer": {"name": "John Doe", "signature": "John Doe", "date": "2024-01-15"}}',
    'admin',
    '2024-01-15',
    'John Doe',
    'Vehicle in good condition'
);

-- Query examples for retrieving data:

-- Get all inspections
SELECT * FROM port_inspections ORDER BY created_at DESC;

-- Get inspection by code number
SELECT * FROM port_inspections WHERE code_no = 'PI-2024-001';

-- Get inspections with specific checklist item
SELECT * FROM port_inspections 
WHERE checklist_data @> '{"items": [{"description": "Air Condition"}]}';

-- Get inspections by date range
SELECT * FROM port_inspections 
WHERE inspection_date BETWEEN '2024-01-01' AND '2024-01-31';

-- Get inspections by status
SELECT * FROM port_inspections WHERE status = 'completed';

-- Count total inspections
SELECT COUNT(*) as total_inspections FROM port_inspections;

-- Get inspections by inspector
SELECT * FROM port_inspections WHERE inspector_name = 'John Doe';
