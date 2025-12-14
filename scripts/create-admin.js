/**
 * Script to create admin user in Supabase
 * Run with: node scripts/create-admin.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'hashanthawic@gmail.com';
  const password = 'hashantha@2025';
  const name = 'hashantha';
  const role = 'admin';
  const phoneNumber = '0769212943';

  try {
    console.log('🚀 Creating admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}\n`);

    // Check if user already exists
    console.log('📋 Checking if user exists...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.warn('⚠️  Could not list users (might not have admin access):', listError.message);
      console.log('   Continuing anyway...\n');
    }

    const existingUser = existingUsers?.users?.find(u => u.email === email);
    let userId;

    if (existingUser) {
      console.log('✅ User already exists, updating password...');
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: password,
          email_confirm: true
        }
      );

      if (error) {
        console.error('❌ Failed to update user password:', error.message);
        throw error;
      }

      userId = existingUser.id;
      console.log('✅ Password updated successfully\n');
    } else {
      console.log('📝 Creating new user...');
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
      });

      if (error) {
        console.error('❌ Failed to create user:', error.message);
        throw error;
      }

      userId = data.user.id;
      console.log('✅ User created successfully\n');
    }

    // Check if agent exists in agents table
    console.log('📋 Checking agents table...');
    const { data: existingAgent, error: agentCheckError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('email', email)
      .single();

    if (agentCheckError && agentCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking agent:', agentCheckError.message);
      throw agentCheckError;
    }

    if (!existingAgent) {
      console.log('📝 Creating agent record...');
      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .insert([
          {
            id: userId,
            name: name,
            email: email,
            role: role,
            expertise: [],
            whatsapp_numbers: phoneNumber ? [phoneNumber] : [],
            max_tickets: 10,
            is_active: true,
            current_load: 0,
          },
        ]);

      if (agentError) {
        console.error('❌ Failed to create agent:', agentError.message);
        console.error('   This might mean the agents table does not exist yet.');
        console.error('   Please run the SQL schema in Supabase Dashboard first (see supabase_schema.sql)');
        throw agentError;
      }
      console.log('✅ Agent record created successfully\n');
    } else {
      console.log('📝 Agent record exists, updating...');
      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .update({
          name: name,
          role: role,
          whatsapp_numbers: phoneNumber ? [phoneNumber] : existingAgent.whatsapp_numbers || [],
          is_active: true,
        })
        .eq('email', email);

      if (agentError) {
        console.error('❌ Failed to update agent:', agentError.message);
        throw agentError;
      }
      console.log('✅ Agent record updated successfully\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Email:        ${email}`);
    console.log(`Password:     ${password}`);
    console.log(`Name:         ${name}`);
    console.log(`Role:         ${role}`);
    console.log(`Phone Number: ${phoneNumber || 'Not set'}`);
    console.log(`User ID:      ${userId}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🎉 You can now login at: http://localhost:3000/login');
    console.log('');

  } catch (error) {
    console.error('\n❌ SETUP FAILED:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   Get it from: Supabase Dashboard > Settings > API > service_role key');
    console.error('2. Make sure you have run the SQL schema in Supabase Dashboard');
    console.error('   See: supabase_schema.sql');
    console.error('3. Check that your Supabase project URL is correct');
    process.exit(1);
  }
}

createAdmin();

