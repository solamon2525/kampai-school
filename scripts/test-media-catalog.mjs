// scripts/test-media-catalog.mjs
// Verifies restoration of English Vocab Hub, deduplication in get_public_media_catalog,
// and registration of interactive media catalog items.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
        if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = val;
      }
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_MEDIA_URLS = [
  '/games/english/weather-seasons-media.html',
  '/games/career/agriculture-basics-media.html',
  '/games/career/cooking-basics-media.html',
  '/games/career/housework-craft-media.html',
  '/games/thai/homophone-context-media.html',
  '/games/social/civic-duty-media.html',
  '/games/social/map-directions-media.html',
  '/games/social/thai-regions-media.html',
];

const TARGET_VOCAB_HUB_ID = '58ca7383-8b28-4628-a73e-f3d326f10868';
const TEACHER_NATTHAPONG_ID = 'a5f53911-b9cb-465a-b963-7202bcb907b1';
const MEDIA_CATEGORY_ID = '9e353886-9890-4222-9d33-53f7883dbcd4';

async function runTests() {
  console.log('--- Starting Media Catalog & Vocab Hub Verification ---\n');
  let hasFailure = false;

  // 1. Check English Vocab Hub (58ca7383)
  console.log('1. Checking English Vocab Hub (58ca7383-8b28-4628-a73e-f3d326f10868)...');
  const { data: vocabItem, error: vocabErr } = await supabase
    .from('educational_hub_items')
    .select('id, title, is_published, grade_levels, tags, tracked_game')
    .eq('id', TARGET_VOCAB_HUB_ID)
    .maybeSingle();

  if (vocabErr || !vocabItem) {
    console.error('❌ Failed to fetch English Vocab Hub item:', vocabErr || 'Item not found');
    hasFailure = true;
  } else {
    console.log(`   Title: "${vocabItem.title}"`);
    console.log(`   is_published: ${vocabItem.is_published}`);
    console.log(`   grade_levels: ${JSON.stringify(vocabItem.grade_levels)}`);

    if (vocabItem.is_published !== true) {
      console.error('❌ FAIL: English Vocab Hub (58ca7383) is NOT published (is_published != true)');
      hasFailure = true;
    } else {
      console.log('✅ PASS: English Vocab Hub is published');
    }

    if (!vocabItem.title.includes('English Vocab Hub')) {
      console.error('❌ FAIL: English Vocab Hub title does not match expected title');
      hasFailure = true;
    } else {
      console.log('✅ PASS: English Vocab Hub title matches');
    }
  }

  // 2. Check get_public_media_catalog deduplication
  console.log('\n2. Checking RPC get_public_media_catalog("ภาษาอังกฤษ") deduplication...');
  const { data: catalogItems, error: catalogErr } = await supabase.rpc('get_public_media_catalog', {
    p_subject: 'ภาษาอังกฤษ',
  });

  if (catalogErr) {
    console.error('❌ RPC error from get_public_media_catalog:', catalogErr);
    hasFailure = true;
  } else {
    const vocabEntries = (catalogItems || []).filter(
      (item) => item.external_url && item.external_url.includes('vocab-hub.html')
    );

    console.log(`   Found ${vocabEntries.length} entry/entries for vocab-hub.html in English media catalog`);

    if (vocabEntries.length === 1) {
      console.log('✅ PASS: Exactly 1 vocab-hub entry returned (no duplicates)');
      if (vocabEntries[0].id === TARGET_VOCAB_HUB_ID) {
        console.log(`✅ PASS: Correct tracked_game item ${TARGET_VOCAB_HUB_ID} selected`);
      } else {
        console.warn(`⚠️ NOTE: Selected vocab item ID is ${vocabEntries[0].id} (expected ${TARGET_VOCAB_HUB_ID})`);
      }
    } else if (vocabEntries.length === 0) {
      console.error('❌ FAIL: No vocab-hub entry returned in English media catalog');
      hasFailure = true;
    } else {
      console.error(`❌ FAIL: Duplicate entries (${vocabEntries.length}) returned for vocab-hub.html`);
      hasFailure = true;
    }
  }

  // 3. Check Newly Cataloged Media Items
  console.log('\n3. Checking 8 newly cataloged media items in educational_hub_items...');
  const { data: mediaItems, error: mediaErr } = await supabase
    .from('educational_hub_items')
    .select('id, title, external_url, is_published, category_id')
    .in('external_url', EXPECTED_MEDIA_URLS);

  if (mediaErr) {
    console.error('❌ Failed to fetch newly cataloged media items:', mediaErr);
    hasFailure = true;
  } else {
    const foundUrls = new Set((mediaItems || []).map((i) => i.external_url));
    let allMediaFound = true;

    for (const url of EXPECTED_MEDIA_URLS) {
      if (foundUrls.has(url)) {
        console.log(`   ✅ Found: ${url}`);
      } else {
        console.error(`   ❌ Missing: ${url}`);
        allMediaFound = false;
        hasFailure = true;
      }
    }

    if (allMediaFound) {
      console.log('✅ PASS: All 8 interactive media items cataloged');
    } else {
      console.error('❌ FAIL: Some media items are not cataloged');
    }
  }

  // 4. Check Teacher Natthapong media item count >= 125
  console.log('\n4. Checking ครูณัฐพงศ์ media items count...');
  const { count: staffMediaCount, error: staffMediaErr } = await supabase
    .from('educational_hub_items')
    .select('id', { count: 'exact', head: true })
    .eq('owner_staff_id', TEACHER_NATTHAPONG_ID)
    .eq('category_id', MEDIA_CATEGORY_ID);

  if (staffMediaErr) {
    console.error('❌ Failed to count media items for ครูณัฐพงศ์:', staffMediaErr);
    hasFailure = true;
  } else {
    console.log(`   Current count: ${staffMediaCount} (Requirement: >= 125)`);
    if (staffMediaCount >= 125) {
      console.log('✅ PASS: ครูณัฐพงศ์ media count >= 125');
    } else {
      console.error(`❌ FAIL: ครูณัฐพงศ์ media count ${staffMediaCount} is below 125`);
      hasFailure = true;
    }
  }

  console.log('\n----------------------------------------------------');
  if (hasFailure) {
    console.error('❌ TEST SUITE FAILED (as expected in TDD RED phase before migration)');
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  }
}

runTests();
