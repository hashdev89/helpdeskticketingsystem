/**
 * Script to set up a user account in Supabase
 * Run with: node scripts/setup-user.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupUser() {
  const email = 'hashanthawic@gmail.com';
  const password = 'Hashdev@2025';
  const name = 'Hashantha';
  const role = 'admin';

  try {
    console.log(`Setting up user: ${email}...`);

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      // Continue anyway, might not have admin access
    }

    const existingUser = existingUsers?.users?.find(u => u.email === email);
    let userId;

    if (existingUser) {
      console.log('User exists, updating password...');
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      );

      if (error) {
        console.error('Failed to update user password:', error);
        throw error;
      }

      userId = existingUser.id;
      console.log('✓ Password updated successfully');
    } else {
      console.log('Creating new user...');
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (error) {
        console.error('Failed to create user:', error);
        throw error;
      }

      userId = data.user.id;
      console.log('✓ User created successfully');
    }

    // Check if agent exists in agents table
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('email', email)
      .single();

    if (!existingAgent) {
      console.log('Creating agent record...');
      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .insert([
          {
            id: userId,
            name: name,
            email: email,
            role: role,
            expertise: [],
            whatsapp_numbers: [],
            max_tickets: 10,
            is_active: true,
            current_load: 0,
          },
        ]);

      if (agentError) {
        console.error('Failed to create agent:', agentError);
        throw agentError;
      }
      console.log('✓ Agent record created successfully');
    } else {
      console.log('Agent record exists, updating if needed...');
      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .update({
          name: name,
          role: role,
        })
        .eq('email', email);

      if (agentError) {
        console.error('Failed to update agent:', agentError);
        throw agentError;
      }
      console.log('✓ Agent record updated successfully');
    }

    console.log('\n✅ Setup complete!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${userId}`);
    console.log('\nYou can now login at http://localhost:3000/login');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nNote: If you see permission errors, you may need to:');
    console.error('1. Set SUPABASE_SERVICE_ROLE_KEY in .env.local (get it from Supabase dashboard)');
    console.error('2. Or use the API route at /api/setup-user instead');
    process.exit(1);
  }
}

setupUser();

