import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'Missing');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        supabaseKey: supabaseKey ? 'Set' : 'Missing',
        message: 'Please check your .env.local file'
      }, { status: 500 });
    }

    // Test Supabase client creation
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      return NextResponse.json({
        error: 'Failed to create Supabase client',
        details: clientError.message
      }, { status: 500 });
    }

    // Test database connection with a simple query
    try {
      const { data, error } = await supabase
        .from('port_inspections')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database query error:', error);
        return NextResponse.json({
          error: 'Database query failed',
          details: error.message,
          code: error.code,
          hint: error.hint
        }, { status: 500 });
      }

      console.log('Database query successful, found records:', data ? data.length : 0);

      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        tableExists: true,
        recordCount: data ? data.length : 0
      });

    } catch (queryError) {
      console.error('Query execution error:', queryError);
      return NextResponse.json({
        error: 'Query execution failed',
        details: queryError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('General error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
