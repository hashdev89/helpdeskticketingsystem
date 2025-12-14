import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.json();
    
    console.log('=== FORM DATA TEST ===');
    console.log('Form data keys:', Object.keys(formData));
    console.log('Vehicle info keys:', formData.vehicleInfo ? Object.keys(formData.vehicleInfo) : 'No vehicle info');
    console.log('Checklist data length:', formData.checklistData ? formData.checklistData.length : 'No checklist data');
    console.log('Tyre data keys:', formData.tyreData ? Object.keys(formData.tyreData) : 'No tyre data');
    console.log('Signatures keys:', formData.signatures ? Object.keys(formData.signatures) : 'No signatures');
    console.log('Vehicle images count:', formData.vehicleImages ? formData.vehicleImages.length : 'No images');
    console.log('========================');

    return NextResponse.json({
      success: true,
      message: 'Form data received successfully',
      dataReceived: {
        vehicleInfo: !!formData.vehicleInfo,
        checklistData: !!formData.checklistData,
        tyreData: !!formData.tyreData,
        signatures: !!formData.signatures,
        vehicleImages: formData.vehicleImages ? formData.vehicleImages.length : 0
      }
    });

  } catch (error) {
    console.error('Test form error:', error);
    return NextResponse.json({
      error: 'Failed to process form data',
      details: error.message
    }, { status: 500 });
  }
}
