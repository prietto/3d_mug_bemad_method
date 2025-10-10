/**
 * Migration Script using Supabase Client for Story 8.3
 * Uses the existing Supabase client configuration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Story 8.3 Migration - Supabase Client');
console.log('📅 Date:', new Date().toISOString());
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('');

async function testConnection() {
  console.log('🔍 Testing database connection...');

  try {
    // Test basic connection by checking pg_tables
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(1);

    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function executeSQLviaRPC(sql) {
  // Try to use raw SQL execution if available
  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.log('⚠️  RPC exec not available:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.log('⚠️  RPC method not available');
    return false;
  }
}

async function createTablesManually() {
  console.log('🏗️  Creating tables manually...');

  try {
    // Check if ai_generation_limits already exists
    const { data: existingLimits } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_generation_limits')
      .single();

    if (!existingLimits) {
      console.log('📝 Table ai_generation_limits does not exist, but direct creation not possible via client');
      console.log('⚠️  Manual SQL execution required');
    } else {
      console.log('✅ ai_generation_limits table already exists');
    }

    // Check if ai_generation_global_counter already exists
    const { data: existingGlobal } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_generation_global_counter')
      .single();

    if (!existingGlobal) {
      console.log('📝 Table ai_generation_global_counter does not exist, but direct creation not possible via client');
      console.log('⚠️  Manual SQL execution required');
    } else {
      console.log('✅ ai_generation_global_counter table already exists');
    }

  } catch (error) {
    console.log('⚠️  Could not verify table status:', error.message);
  }
}

async function provideManualInstructions() {
  console.log('\n📋 Manual Migration Instructions:');
  console.log('');
  console.log('Since direct database migration requires elevated privileges,');
  console.log('please execute the following steps manually:');
  console.log('');
  console.log('1. 🌐 Go to Supabase Dashboard:');
  console.log('   https://app.supabase.com');
  console.log('');
  console.log('2. 🔐 Sign in to your account');
  console.log('');
  console.log('3. 📊 Select your project: vavyzbeqdjrlushuqzjk');
  console.log('');
  console.log('4. 🔧 Go to SQL Editor');
  console.log('');
  console.log('5. 📋 Copy and paste this SQL:');
  console.log('');
  console.log('```sql');
  console.log('-- Migration: AI Generation Rate Limiting Tables');
  console.log('-- Story: 8.3 - Multi-Layer Rate Limiting & Production Readiness');
  console.log('');
  console.log('-- Table: ai_generation_limits (IP Tracking - Layer 2)');
  console.log('CREATE TABLE IF NOT EXISTS ai_generation_limits (');
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
  console.log('  ip_address TEXT NOT NULL,');
  console.log('  generation_count INTEGER DEFAULT 1 CHECK (generation_count >= 0),');
  console.log('  last_generation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('  date_key TEXT NOT NULL,');
  console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('  CONSTRAINT unique_ip_date UNIQUE(ip_address, date_key)');
  console.log(');');
  console.log('');
  console.log('-- Index for fast IP + date lookups');
  console.log('CREATE INDEX IF NOT EXISTS idx_ai_limits_ip_date');
  console.log('ON ai_generation_limits(ip_address, date_key);');
  console.log('');
  console.log('-- Table: ai_generation_global_counter (Global Daily Counter - Layer 3)');
  console.log('CREATE TABLE IF NOT EXISTS ai_generation_global_counter (');
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
  console.log('  date_key TEXT NOT NULL UNIQUE,');
  console.log('  total_generations INTEGER DEFAULT 0 CHECK (total_generations >= 0),');
  console.log('  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log(');');
  console.log('');
  console.log('-- Index for fast date lookups');
  console.log('CREATE INDEX IF NOT EXISTS idx_global_counter_date');
  console.log('ON ai_generation_global_counter(date_key);');
  console.log('');
  console.log('-- Enable Row Level Security (RLS)');
  console.log('ALTER TABLE ai_generation_limits ENABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE ai_generation_global_counter ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('-- Function: Increment IP generation counter');
  console.log('CREATE OR REPLACE FUNCTION increment_ip_generation(');
  console.log('  p_ip_address TEXT,');
  console.log('  p_date_key TEXT');
  console.log(')');
  console.log('RETURNS TABLE(new_count INTEGER) AS $$');
  console.log('DECLARE');
  console.log('  v_new_count INTEGER;');
  console.log('BEGIN');
  console.log('  INSERT INTO ai_generation_limits (ip_address, date_key, generation_count, last_generation_at)');
  console.log('  VALUES (p_ip_address, p_date_key, 1, NOW())');
  console.log('  ON CONFLICT (ip_address, date_key)');
  console.log('  DO UPDATE SET');
  console.log('    generation_count = ai_generation_limits.generation_count + 1,');
  console.log('    last_generation_at = NOW()');
  console.log('  RETURNING generation_count INTO v_new_count;');
  console.log('');
  console.log('  RETURN QUERY SELECT v_new_count;');
  console.log('END;');
  console.log('$$ LANGUAGE plpgsql;');
  console.log('');
  console.log('-- Function: Increment global generation counter');
  console.log('CREATE OR REPLACE FUNCTION increment_global_generation(');
  console.log('  p_date_key TEXT');
  console.log(')');
  console.log('RETURNS TABLE(new_total INTEGER) AS $$');
  console.log('DECLARE');
  console.log('  v_new_total INTEGER;');
  console.log('BEGIN');
  console.log('  INSERT INTO ai_generation_global_counter (date_key, total_generations, last_updated_at)');
  console.log('  VALUES (p_date_key, 1, NOW())');
  console.log('  ON CONFLICT (date_key)');
  console.log('  DO UPDATE SET');
  console.log('    total_generations = ai_generation_global_counter.total_generations + 1,');
  console.log('    last_updated_at = NOW()');
  console.log('  RETURNING total_generations INTO v_new_total;');
  console.log('');
  console.log('  RETURN QUERY SELECT v_new_total;');
  console.log('END;');
  console.log('$$ LANGUAGE plpgsql;');
  console.log('');
  console.log('-- Seed initial global counter for today');
  console.log('INSERT INTO ai_generation_global_counter (date_key, total_generations)');
  console.log('VALUES (TO_CHAR(NOW() AT TIME ZONE \'UTC\', \'YYYY-MM-DD\'), 0)');
  console.log('ON CONFLICT (date_key) DO NOTHING;');
  console.log('```');
  console.log('');
  console.log('6. ▶️  Click "Run" to execute the SQL');
  console.log('');
  console.log('7. ✅ Verify tables were created in the Table Editor');
  console.log('');
  console.log('After completing these steps, Story 8.3 will be ready for deployment!');
  console.log('');
}

async function main() {
  const connectionOk = await testConnection();

  if (!connectionOk) {
    console.error('❌ Cannot connect to database');
    console.log('💡 Please check your Supabase credentials');
    return;
  }

  console.log('🔍 Attempting direct migration...');

  // Try different approaches
  const sqlSuccess = await executeSQLviaRPC(`
    CREATE TABLE IF NOT EXISTS ai_generation_limits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_address TEXT NOT NULL,
      generation_count INTEGER DEFAULT 1 CHECK (generation_count >= 0),
      last_generation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      date_key TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_ip_date UNIQUE(ip_address, date_key)
    );
  `);

  if (!sqlSuccess) {
    await createTablesManually();
    await provideManualInstructions();
  }
}

main().catch(console.error);