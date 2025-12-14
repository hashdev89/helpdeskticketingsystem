import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Function to get next serial number
async function getNextSerialNumber() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('port_inspections')
      .select('code_no')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last code:', error);
      return '001';
    }

    if (data && data.length > 0) {
      const lastCode = data[0].code_no;
      // Extract only numeric part and convert to number
      const lastNumber = parseInt(lastCode.toString().replace(/\D/g, '')) || 0;
      const nextNumber = lastNumber + 1;
      return nextNumber.toString().padStart(3, '0');
    }

    return '001';
  } catch (error) {
    console.error('Error in getNextSerialNumber:', error);
    return '001';
  }
}

// Function to optimize image
async function optimizeImage(imageData, maxWidth = 1200, quality = 80) {
  try {
    // Remove data URL prefix to get base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Optimize image using sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(maxWidth, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ 
        quality: quality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    // Convert back to base64
    const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    
    console.log(`Image optimized: ${buffer.length} -> ${optimizedBuffer.length} bytes (${Math.round((1 - optimizedBuffer.length / buffer.length) * 100)}% reduction)`);
    
    return optimizedBase64;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return imageData; // Return original if optimization fails
  }
}

// Function to upload image to Supabase Storage with date-based folder
async function uploadImageToStorage(imageData, fileName, dateString) {
  try {
    const supabase = getSupabaseClient();
    // Remove data URL prefix to get base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create date-based path
    const datePath = `${dateString}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(datePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload image to storage');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(datePath);

    return {
      filePath: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    throw new Error('Failed to upload image to storage');
  }
}



export async function POST(request) {
  try {
    // Check if required environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials', details: 'Please check your .env.local file' },
        { status: 500 }
      );
    }

    const formData = await request.json();
    console.log('Received form data keys:', Object.keys(formData));
    
    // Extract data from the form
    const {
      vehicleInfo,
      checklistData,
      tyreData,
      signatures,
      vehicleImages
    } = formData;

    // Validate required data
    if (!vehicleInfo || !checklistData || !tyreData || !signatures) {
      console.error('Missing required form data');
      return NextResponse.json(
        { error: 'Missing required form data', details: 'Please ensure all form sections are filled' },
        { status: 400 }
      );
    }

    // Generate next serial number if code_no is empty
    let codeNo = vehicleInfo.codeNo;
    if (!codeNo || codeNo.trim() === '') {
      codeNo = await getNextSerialNumber();
    }

    console.log('Generated code number:', codeNo);

    // Upload multiple images to Supabase Storage if provided
    let imageUrls = [];
    if (vehicleImages && vehicleImages.length > 0) {
      const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '.'); // Format: "2025.08.19"
      
      for (let i = 0; i < vehicleImages.length; i++) {
        const image = vehicleImages[i];
        const fileName = `${vehicleInfo.make || 'UNKNOWN'}_${vehicleInfo.chassisNo || 'NOCHASSIS'}_${codeNo}_${i + 1}.jpg`;
        
        try {
          // Optimize image
          const optimizedImage = await optimizeImage(image.preview);
          
          // Upload to Supabase Storage
          const supabaseResult = await uploadImageToStorage(optimizedImage, fileName, dateString);
          imageUrls.push({
            url: supabaseResult.publicUrl,
            description: image.description || `Photo ${i + 1}`,
            fileName: fileName
          });
        } catch (error) {
          console.error(`Image ${i + 1} upload error:`, error);
          // Continue with other images even if one fails
        }
      }
    }

    // Prepare data for database insertion
    const inspectionData = {
      // Vehicle Information
      code_no: codeNo,
      make: vehicleInfo.make || null,
      location: vehicleInfo.location || null,
      colour: vehicleInfo.colour || null,
      fuel: vehicleInfo.fuel || null,
      chassis_no: vehicleInfo.chassisNo || null,
      mileage: vehicleInfo.mileage || null,
      engine_no: vehicleInfo.engineNo || null,
      no_of_doors: parseInt(vehicleInfo.noOfDoors) || 0,
      fuel_level: vehicleInfo.fuelLevel || null,
      vehicle_photo_url: imageUrls.length > 0 ? imageUrls[0].url : null, // Keep first image as main photo for backward compatibility
      vehicle_photos: imageUrls, // Store all images as JSONB
      
      // Complex data as JSONB
      checklist_data: {
        items: checklistData.map(item => ({
          id: item.id,
          description: item.description,
          note: item.note || null,
          qt: item.qt || "0",
          // Radio button fields
          airCondition: item.airCondition || null,
          horn: item.horn || null,
          powerShutterSwitch: item.powerShutterSwitch || null,
          airPump: item.airPump || null,
          glueBottle: item.glueBottle || null,
          valve: item.valve || null,
          torBar: item.torBar || null
        }))
      },
      
      tyre_data: tyreData,
      signatures_data: signatures,
      
      // Metadata
      created_by: 'user', // You can get this from authentication
      inspection_date: new Date().toISOString().split('T')[0],
      inspector_name: signatures.portInspectionOfficer?.name || 'Unknown',
      notes: 'Port inspection completed',
      status: 'completed'
    };

    console.log('Prepared inspection data:', JSON.stringify(inspectionData, null, 2));

    // Insert data into the database
    console.log('Attempting to insert inspection data...');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('port_inspections')
      .insert([inspectionData])
      .select();

    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      return NextResponse.json(
        { error: 'Failed to save inspection data', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    console.log('Inspection data inserted successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Port inspection saved successfully',
      data: data[0],
      codeNo: codeNo,
      imageUrls: imageUrls
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
    const { searchParams } = new URL(request.url);
    const codeNo = searchParams.get('code_no');
    const id = searchParams.get('id');
    const getNextCode = searchParams.get('getNextCode');

    // Handle next code generation request
    if (getNextCode === 'true') {
      const nextCode = await getNextSerialNumber();
      return NextResponse.json({
        success: true,
        nextCode: nextCode
      });
    }

    let query = supabase
      .from('port_inspections')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by code number if provided
    if (codeNo) {
      query = query.eq('code_no', codeNo);
    }

    // Filter by ID if provided
    if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inspection data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
