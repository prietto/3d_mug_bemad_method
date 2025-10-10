/**
 * Direct Migration Script for Story 8.3
 * Executes SQL commands directly using the database connection string
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Extract connection details from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Parse Supabase URL to get connection details
const url = new URL(supabaseUrl);
const projectId = url.hostname.split('.')[0];
const connectionStr = `postgresql://postgres:${serviceRoleKey}@db.${url.hostname}/postgres`;

console.log('🚀 Story 8.3 Migration - Direct Database Connection');
console.log('📅 Date:', new Date().toISOString());
console.log('🔗 Project:', projectId);
console.log('');

const pool = new Pool({
  connectionString: connectionStr,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('✅ Connected to database successfully');

    // Begin transaction
    await client.query('BEGIN');
    console.log('📝 Transaction started');

    // Check if tables already exist
    const { rows: existingTables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('ai_generation_limits', 'ai_generation_global_counter')
    `);

    console.log('📋 Existing tables:', existingTables.map(t => t.table_name));

    // Create ai_generation_limits table
    console.log('🏗️  Creating ai_generation_limits table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_generation_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address TEXT NOT NULL,
        generation_count INTEGER DEFAULT 1 CHECK (generation_count >= 0),
        last_generation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        date_key TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_ip_date UNIQUE(ip_address, date_key)
      )
    `);
    console.log('✅ ai_generation_limits table created');

    // Create index for ai_generation_limits
    console.log('📊 Creating index for ai_generation_limits...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_limits_ip_date
      ON ai_generation_limits(ip_address, date_key)
    `);
    console.log('✅ Index created for ai_generation_limits');

    // Create ai_generation_global_counter table
    console.log('🏗️  Creating ai_generation_global_counter table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_generation_global_counter (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date_key TEXT NOT NULL UNIQUE,
        total_generations INTEGER DEFAULT 0 CHECK (total_generations >= 0),
        last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ ai_generation_global_counter table created');

    // Create index for ai_generation_global_counter
    console.log('📊 Creating index for ai_generation_global_counter...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_global_counter_date
      ON ai_generation_global_counter(date_key)
    `);
    console.log('✅ Index created for ai_generation_global_counter');

    // Enable RLS on both tables
    console.log('🔒 Enabling Row Level Security...');
    await client.query('ALTER TABLE ai_generation_limits ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE ai_generation_global_counter ENABLE ROW LEVEL SECURITY');
    console.log('✅ RLS enabled on both tables');

    // Create increment_ip_generation function
    console.log('⚙️  Creating increment_ip_generation function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_ip_generation(
        p_ip_address TEXT,
        p_date_key TEXT
      )
      RETURNS TABLE(new_count INTEGER) AS $$
      DECLARE
        v_new_count INTEGER;
      BEGIN
        INSERT INTO ai_generation_limits (ip_address, date_key, generation_count, last_generation_at)
        VALUES (p_ip_address, p_date_key, 1, NOW())
        ON CONFLICT (ip_address, date_key)
        DO UPDATE SET
          generation_count = ai_generation_limits.generation_count + 1,
          last_generation_at = NOW()
        RETURNING generation_count INTO v_new_count;

        RETURN QUERY SELECT v_new_count;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ increment_ip_generation function created');

    // Create increment_global_generation function
    console.log('⚙️  Creating increment_global_generation function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_global_generation(
        p_date_key TEXT
      )
      RETURNS TABLE(new_total INTEGER) AS $$
      DECLARE
        v_new_total INTEGER;
      BEGIN
        INSERT INTO ai_generation_global_counter (date_key, total_generations, last_updated_at)
        VALUES (p_date_key, 1, NOW())
        ON CONFLICT (date_key)
        DO UPDATE SET
          total_generations = ai_generation_global_counter.total_generations + 1,
          last_updated_at = NOW()
        RETURNING total_generations INTO v_new_total;

        RETURN QUERY SELECT v_new_total;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ increment_global_generation function created');

    // Add comments
    console.log('📝 Adding table comments...');
    await client.query(`
      COMMENT ON TABLE ai_generation_limits IS 'Tracks per-IP AI generation counts with daily reset (Layer 2)'
    `);
    await client.query(`
      COMMENT ON TABLE ai_generation_global_counter IS 'Tracks total daily AI generations across all users (Layer 3)'
    `);
    await client.query(`
      COMMENT ON FUNCTION increment_ip_generation IS 'Atomically increments IP generation counter for Layer 2 rate limiting'
    `);
    await client.query(`
      COMMENT ON FUNCTION increment_global_generation IS 'Atomically increments global generation counter for Layer 3 rate limiting'
    `);
    console.log('✅ Comments added');

    // Seed initial global counter for today
    console.log('🌱 Seeding initial global counter...');
    await client.query(`
      INSERT INTO ai_generation_global_counter (date_key, total_generations)
      VALUES (TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), 0)
      ON CONFLICT (date_key) DO NOTHING
    `);
    console.log('✅ Initial global counter seeded');

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');

    // Verification
    console.log('\n🔍 Verifying migration...');

    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('ai_generation_limits', 'ai_generation_global_counter')
      ORDER BY table_name
    `);

    const { rows: functions } = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('increment_ip_generation', 'increment_global_generation')
      ORDER BY routine_name
    `);

    const { rows: indexes } = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   Tables created: ${tables.length}`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    console.log(`   Functions created: ${functions.length}`);
    functions.forEach(f => console.log(`   - ${f.routine_name}`));
    console.log(`   Indexes created: ${indexes.length}`);
    indexes.forEach(i => console.log(`   - ${i.indexname}`));

    console.log('\n🎉 Story 8.3 is now ready for deployment!');
    console.log('📋 Rate limiting infrastructure is in place');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check:');
      console.error('- Supabase project is active');
      console.error('- Database credentials are correct');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check:');
      console.error('- SUPABASE_SERVICE_ROLE_KEY is correct');
      console.error('- User has necessary privileges');
    }

    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();