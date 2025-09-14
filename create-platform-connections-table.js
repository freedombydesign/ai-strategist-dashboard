const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey)
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createPlatformConnectionsTable() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', '005_platform_connections.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('🔄 Creating platform_connections table...')
    console.log('📄 SQL Content:')
    console.log(sqlContent.substring(0, 200) + '...')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })

    if (error) {
      console.error('❌ Error creating table:', error)

      // If the RPC doesn't exist, try direct SQL execution (this might not work)
      console.log('🔄 Trying alternative method...')

      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`🔄 Executing: ${statement.substring(0, 50)}...`)

          // For CREATE TABLE, we can use the raw SQL
          const { error: execError } = await supabase
            .from('_temp')  // This won't work, but let's try anyway
            .select('1')

          if (execError) {
            console.log('❌ Cannot execute raw SQL via client library')
            break
          }
        }
      }
    } else {
      console.log('✅ Successfully created platform_connections table!')
      console.log('📊 Result:', data)
    }

    // Test if table exists by trying to query it
    console.log('🔄 Testing table creation...')
    const { data: testData, error: testError } = await supabase
      .from('platform_connections')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Table test failed:', testError.message)

      if (testError.message.includes('does not exist') || testError.message.includes('schema cache')) {
        console.log('🔧 The table still doesn\'t exist. You need to execute the SQL manually in Supabase dashboard.')
        console.log('📋 SQL to execute:')
        console.log(sqlContent)
      }
    } else {
      console.log('✅ Table exists and is accessible!')
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createPlatformConnectionsTable()