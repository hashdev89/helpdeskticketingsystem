import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.json();
    
    // Extract data from the form
    const {
      vehicleInfo,
      checklistData,
      tyreData,
      signatures,
      vehicleImage
    } = formData;

    // Log the received data for debugging
    console.log('Received form data:', {
      vehicleInfo,
      checklistDataLength: checklistData?.length,
      tyreData,
      signatures,
      hasImage: !!vehicleImage
    });

    // Simulate successful save (without database)
    const mockSavedData = {
      id: Date.now(),
      code_no: vehicleInfo?.codeNo || 'TEST-001',
      make: vehicleInfo?.make || 'TOYOTA',
      location: vehicleInfo?.location || 'Test Location',
      created_at: new Date().toISOString(),
      status: 'completed'
    };

    return NextResponse.json({
      success: true,
      message: 'Port inspection saved successfully (mock)',
      data: mockSavedData
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Return mock data for testing
    const mockInspections = [
      {
        id: 1,
        code_no: 'TEST-001',
        make: 'TOYOTA',
        location: 'Test Location',
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_name: 'Test Inspector',
        status: 'completed',
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockInspections
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
