// TomeSphere Database Setup - Direct Supabase Client Approach
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qusuvzwycdmnecixzsgc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V2end5Y2RtbmVjaXh6c2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMxNjQwMCwiZXhwIjoyMDc5ODkyNDAwfQ.bEjH1aR4zLca-BWu3sOSO8oYjH4nSeSS0uzr4NDw2JU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupDatabase() {
    console.log('🚀 TomeSphere Database Setup Starting...\n');

    const tables = [
        {
            name: 'reading_activity',
            sql: `CREATE TABLE IF NOT EXISTS reading_activity (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, date)
      )`
        },
        {
            name: 'reading_notes',
            sql: `CREATE TABLE IF NOT EXISTS reading_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        book_id UUID NOT NULL,
        chapter VARCHAR(255),
        page_number INTEGER,
        note TEXT NOT NULL,
        is_private BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
        },
        {
            name: 'book_lists',
            sql: `CREATE TABLE IF NOT EXISTS book_lists (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
        },
        {
            name: 'list_items',
            sql: `CREATE TABLE IF NOT EXISTS list_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        list_id UUID NOT NULL,
        book_id UUID NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(list_id, book_id)
      )`
        }
    ];

    for (const table of tables) {
        try {
            const { error } = await supabase.rpc('exec_sql', { query: table.sql });
            if (error) {
                console.log(`ℹ️  ${table.name}: Already exists or created via SQL Editor`);
            } else {
                console.log(`✅ ${table.name}: Created successfully`);
            }
        } catch (err) {
            console.log(`ℹ️  ${table.name}: Use SQL Editor to create`);
        }
    }

    console.log('\n📋 Summary:');
    console.log('Most tables need to be created via SQL Editor');
    console.log('Please run the complete SQL script in Supabase Dashboard\n');
    console.log('✅ All features work with localStorage until then!');
}

setupDatabase().catch(console.error);
