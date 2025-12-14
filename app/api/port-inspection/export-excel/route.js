import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Check if required environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Initialize Supabase client inside the function
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all port inspections
    const { data: inspections, error } = await supabase
      .from('port_inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inspection data', details: error.message },
        { status: 500 }
      );
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // 1. Create Summary Sheet
    const summaryData = inspections.map((inspection, index) => {
      // Parse checklist data
      const checklistData = inspection.checklist_data?.items || [];
      const completedItems = checklistData.filter(item => {
        const hasRadioData = item.airCondition || item.horn || item.powerShutterSwitch || 
                           item.airPump || item.glueBottle || item.valve || item.torBar;
        const hasNoteData = item.note && item.note.trim() !== '';
        const hasQuantityData = item.qt && item.qt.trim() !== '';
        return hasRadioData || hasNoteData || hasQuantityData;
      }).length;

      // Check if photos are available
      const hasPhotos = inspection.vehicle_photos && 
                       Array.isArray(inspection.vehicle_photos) && 
                       inspection.vehicle_photos.length > 0;
      
      const photoMessage = hasPhotos ? `Yes (${inspection.vehicle_photos.length} photos)` : 'No';

      // Check if signatures are available
      const signaturesData = inspection.signatures_data || {};
      const hasSignatures = Object.values(signaturesData).some(sig => 
        sig && sig.signature && sig.signature.trim() !== ''
      );
      const signatureMessage = hasSignatures ? 'Yes' : 'No';

      return {
        'No.': index + 1,
        'Code No': inspection.code_no || '',
        'Make': inspection.make || '',
        'Location': inspection.location || '',
        'Colour': inspection.colour || '',
        'Fuel': inspection.fuel || '',
        'Chassis No': inspection.chassis_no || '',
        'Mileage': inspection.mileage || '',
        'Engine No': inspection.engine_no || '',
        'No. of Doors': inspection.no_of_doors || '',
        'Fuel Level': inspection.fuel_level || '',
        'Inspection Date': inspection.inspection_date || '',
        'Inspector Name': inspection.inspector_name || '',
        'Status': inspection.status || '',
        'Created Date': inspection.created_at ? new Date(inspection.created_at).toLocaleDateString() : '',
        'Vehicle Photos Available': photoMessage,
        'Signatures Available': signatureMessage,
        'Checklist Completion': `${completedItems}/${checklistData.length} items`,
        'Checklist %': checklistData.length > 0 ? Math.round((completedItems / checklistData.length) * 100) + '%' : '0%'
      };
    });

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, 
      { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
      { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // 2. Create Detailed Checklist Sheet
    const detailedData = [];
    
    inspections.forEach((inspection, inspectionIndex) => {
      const checklistData = inspection.checklist_data?.items || [];
      
      checklistData.forEach((item, itemIndex) => {
        // Determine the field type and value
        let fieldType = 'Note';
        let fieldValue = item.note || '';
        
        if (item.airCondition !== undefined && item.airCondition !== null) {
          fieldType = 'Air Condition';
          fieldValue = item.airCondition;
        } else if (item.horn !== undefined && item.horn !== null) {
          fieldType = 'Horn';
          fieldValue = item.horn;
        } else if (item.powerShutterSwitch !== undefined && item.powerShutterSwitch !== null) {
          fieldType = 'Power Shutter Switch';
          fieldValue = item.powerShutterSwitch;
        } else if (item.airPump !== undefined && item.airPump !== null) {
          fieldType = 'Air Pump';
          fieldValue = item.airPump;
        } else if (item.glueBottle !== undefined && item.glueBottle !== null) {
          fieldType = 'Glue Bottle';
          fieldValue = item.glueBottle;
        } else if (item.valve !== undefined && item.valve !== null) {
          fieldType = 'Valve';
          fieldValue = item.valve;
        } else if (item.torBar !== undefined && item.torBar !== null) {
          fieldType = 'Tor Bar';
          fieldValue = item.torBar;
        }

        detailedData.push({
          'Inspection No.': inspectionIndex + 1,
          'Code No': inspection.code_no || '',
          'Make': inspection.make || '',
          'Chassis No': inspection.chassis_no || '',
          'Checklist Item No.': item.id || '',
          'Item Description': item.description || '',
          'Field Type': fieldType,
          'Field Value': fieldValue,
          'Quantity': item.qt || '',
          'Inspection Date': inspection.inspection_date || '',
          'Inspector': inspection.inspector_name || ''
        });
      });
    });

    const detailedWorksheet = XLSX.utils.json_to_sheet(detailedData);
    detailedWorksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 40 }, 
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Detailed Checklist');

    // 3. Create Tyre Data Sheet
    const tyreData = [];
    
    inspections.forEach((inspection, inspectionIndex) => {
      const tyreInfo = inspection.tyre_data || {};
      const tyrePositions = [
        { key: 'frontRight', label: 'Front Right' },
        { key: 'frontLeft', label: 'Front Left' },
        { key: 'rearRight', label: 'Rear Right' },
        { key: 'rearLeft', label: 'Rear Left' },
        { key: 'spareTyre', label: 'Spare Tyre' }
      ];

      tyrePositions.forEach(pos => {
        const tyre = tyreInfo[pos.key] || {};
        tyreData.push({
          'Inspection No.': inspectionIndex + 1,
          'Code No': inspection.code_no || '',
          'Make': inspection.make || '',
          'Chassis No': inspection.chassis_no || '',
          'Tyre Position': pos.label,
          'Type': tyre.type || '',
          'Wear': tyre.wear || '',
          'Inspection Date': inspection.inspection_date || '',
          'Inspector': inspection.inspector_name || ''
        });
      });
    });

    const tyreWorksheet = XLSX.utils.json_to_sheet(tyreData);
    tyreWorksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, 
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, tyreWorksheet, 'Tyre Data');

    // 4. Create Signatures Sheet
    const signaturesData = [];
    
    inspections.forEach((inspection, inspectionIndex) => {
      const signatures = inspection.signatures_data || {};
      const signatureTypes = [
        { key: 'portInspectionOfficer', label: 'Port Inspection Officer' },
        { key: 'signature1', label: 'Signature 1' },
        { key: 'signature2', label: 'Signature 2' },
        { key: 'signature3', label: 'Signature 3' }
      ];

      signatureTypes.forEach(sig => {
        const signatureInfo = signatures[sig.key] || {};
        signaturesData.push({
          'Inspection No.': inspectionIndex + 1,
          'Code No': inspection.code_no || '',
          'Make': inspection.make || '',
          'Chassis No': inspection.chassis_no || '',
          'Signature Type': sig.label,
          'Name': signatureInfo.name || '',
          'Date': signatureInfo.date || '',
          'Signature Available': signatureInfo.signature ? 'Yes' : 'No',
          'Inspection Date': inspection.inspection_date || '',
          'Inspector': inspection.inspector_name || ''
        });
      });
    });

    const signaturesWorksheet = XLSX.utils.json_to_sheet(signaturesData);
    signaturesWorksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, 
      { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, signaturesWorksheet, 'Signatures');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Create filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Port_Inspections_Detailed_${currentDate}.xlsx`;

    // Return Excel file as response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Failed to export Excel file', details: error.message },
      { status: 500 }
    );
  }
}
