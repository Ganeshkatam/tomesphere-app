// Check existing Supabase Storage buckets
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageBuckets() {
    console.log('🗂️ Checking Supabase Storage Buckets...\n');

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (!buckets || buckets.length === 0) {
            console.log('⚠️  No storage buckets found');
            return;
        }

        console.log(`✅ Found ${buckets.length} bucket(s):\n`);

        buckets.forEach((bucket, index) => {
            console.log(`${index + 1}. Name: "${bucket.name}"`);
            console.log(`   ID: ${bucket.id}`);
            console.log(`   Public: ${bucket.public ? '✅ YES' : '❌ NO (private)'}`);
            console.log(`   Created: ${new Date(bucket.created_at).toLocaleDateString()}`);
            console.log('');
        });

        // Check if we have the buckets we need
        const hasCoversBucket = buckets.some(b => b.name.includes('cover'));
        const hasBooksBucket = buckets.some(b => b.name.includes('book') || b.name.includes('pdf'));

        console.log('📋 Summary:');
        console.log(`   Covers bucket: ${hasCoversBucket ? '✅ Found' : '❌ Missing'}`);
        console.log(`   Books/PDF bucket: ${hasBooksBucket ? '✅ Found' : '❌ Missing'}`);

        if (buckets.length > 0) {
            console.log('\n💡 Bucket names to use in code:');
            buckets.forEach(b => console.log(`   - "${b.name}"`));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkStorageBuckets();
