// Verify enhanced schema tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEnhancedSchema() {
    console.log('🔍 Verifying Enhanced Schema...\n');

    const enhancedTables = [
        'collections',
        'collection_items',
        'user_follows',
        'discussions',
        'discussion_replies',
        'book_clubs',
        'book_club_members',
        'reading_progress',
        'highlights',
        'bookmarks',
        'reading_goals',
        'achievements',
        'user_achievements',
        'tags',
        'book_tags',
        'notifications',
        'book_series',
        'ai_recommendations',
        'user_preferences'
    ];

    let successCount = 0;
    let failCount = 0;

    for (const table of enhancedTables) {
        try {
            const { error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}`);
                failCount++;
            } else {
                console.log(`✅ ${table} (${count || 0} rows)`);
                successCount++;
            }
        } catch (e) {
            console.log(`❌ ${table} - ${e.message}`);
            failCount++;
        }
    }

    console.log(`\n📊 Summary: ${successCount}/${enhancedTables.length} tables created`);

    if (successCount === enhancedTables.length) {
        console.log('🎉 All enhanced features are ready!');
    } else {
        console.log(`⚠️ ${failCount} tables missing - schema may need to be re-run`);
    }
}

verifyEnhancedSchema();
