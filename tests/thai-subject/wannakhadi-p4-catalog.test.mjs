import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const coverPath = path.resolve('public/games/thai/wannakhadi-p4-media-cover.png');
const migrationPath = path.resolve('supabase/migrations/588_seed_wannakhadi_p4_media.sql');

test('Task 5: Cover artwork and database registration migration exist and satisfy contracts', () => {
  // Check migration file
  assert.ok(fs.existsSync(migrationPath), 'Migration 588 must exist');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  assert.ok(migrationSql.includes('/games/thai/wannakhadi-p4-media.html'), 'Migration must reference media URL');
  assert.ok(migrationSql.includes('/games/thai/wannakhadi-p4-media-worksheet.html'), 'Migration must reference worksheet URL');
  assert.ok(migrationSql.includes('wannakhadi-p4-media-cover.png'), 'Migration must reference cover URL');
  assert.ok(migrationSql.includes('educational_hub_items'), 'Migration must upsert educational_hub_items');
  assert.ok(migrationSql.includes('game_docs'), 'Migration must upsert game_docs');
  assert.ok(migrationSql.includes('indicator_games'), 'Migration must link indicator_games');
  assert.ok(migrationSql.includes('ท 5.1 ป.4/1') || migrationSql.includes('ท 1.1 ป.4/1'), 'Migration must link Thai curriculum indicators');

  // Check cover image
  assert.ok(fs.existsSync(coverPath), 'Cover image must exist');
  const stat = fs.statSync(coverPath);
  assert.ok(stat.size > 1000, 'Cover image file size must be substantial (> 1KB)');

  // Check PNG signature and 1280x720 dimensions
  const buf = fs.readFileSync(coverPath);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Must be valid PNG file');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.equal(width, 1280, 'Width must be 1280');
  assert.equal(height, 720, 'Height must be 720 (16:9 ratio)');
});
