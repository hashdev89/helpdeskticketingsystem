import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // Update existing user's password
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      );

      if (error) {
        return NextResponse.json(
          { error: `Failed to update user: ${error.message}` },
          { status: 500 }
        );
      }

      userId = existingUser.id;
    } else {
      // Create new user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
      });

      if (error) {
        return NextResponse.json(
          { error: `Failed to create user: ${error.message}` },
          { status: 500 }
        );
      }

      userId = data.user.id;
    }

    // Check if agent exists in agents table
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('email', email)
      .single();

    if (!existingAgent) {
      // Create agent record
      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .insert([
          {
            id: userId,
            name: name || email.split('@')[0],
            email: email,
            role: role || 'admin',
            expertise: [],
            whatsapp_numbers: [],
            max_tickets: 10,
            is_active: true,
            current_load: 0,
          },
        ]);

      if (agentError) {
        return NextResponse.json(
          { error: `Failed to create agent: ${agentError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Update existing agent if needed
      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .update({
          name: name || existingAgent.name,
          role: role || existingAgent.role,
        })
        .eq('email', email);

      if (agentError) {
        return NextResponse.json(
          { error: `Failed to update agent: ${agentError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: existingUser 
        ? 'User password updated and agent record verified' 
        : 'User created successfully',
      userId: userId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

