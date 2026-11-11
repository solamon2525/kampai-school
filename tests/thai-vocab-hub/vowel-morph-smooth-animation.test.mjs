import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubDir = path.resolve(__dirname, '../../public/games/thai/thai-vocab-hub');

const cssContent = fs.readFileSync(path.join(hubDir, 'style.css'), 'utf8');

// 1. Verify CSS has all required keyframes and classes for smooth phases
assert.ok(cssContent.includes('@keyframes suffixMorphAscend'), 'Must have @keyframes suffixMorphAscend');
assert.ok(cssContent.includes('@keyframes markMorphSettle'), 'Must have @keyframes markMorphSettle');
assert.ok(cssContent.includes('@keyframes suffixEvaporate'), 'Must have @keyframes suffixEvaporate');
assert.ok(cssContent.includes('@keyframes wordElasticSettle'), 'Must have @keyframes wordElasticSettle');
assert.ok(cssContent.includes('@keyframes morphGlowPulse'), 'Must have @keyframes morphGlowPulse');

assert.ok(cssContent.includes('.suffix-morphing-out'), 'Must have .suffix-morphing-out class');
assert.ok(cssContent.includes('.mark-morphing-in'), 'Must have .mark-morphing-in class');
assert.ok(cssContent.includes('.suffix-evaporating'), 'Must have .suffix-evaporating class');
assert.ok(cssContent.includes('.word-elastic-settle'), 'Must have .word-elastic-settle class');

// 2. Verify vowel-morph.js Step 3 renders transition elements for morphing rules
const dataJs = fs.readFileSync(path.join(hubDir, 'data.js'), 'utf8');
const morphJs = fs.readFileSync(path.join(hubDir, 'vowel-morph.js'), 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: 'dangerously' });
dom.window.eval(dataJs);
dom.window.eval(morphJs);

// Open studio with 'แข็ง' (rule: ae_to_taikhu - vowel morphing)
dom.window.ThaiVowelMorph.open('แข็ง');
// Advance to step 2 then step 3
dom.window.ThaiVowelMorph.nextStep(); // to step 2
dom.window.ThaiVowelMorph.nextStep(); // to step 3

const stage = dom.window.document.getElementById('morph-stage-screen');
assert.ok(stage, 'Must find #morph-stage-screen');
const suffixGhost = stage.querySelector('.suffix-morphing-out');
const markIn = stage.querySelector('.mark-morphing-in');

assert.ok(suffixGhost, 'Step 3 morphing must contain .suffix-morphing-out element for smooth visual handoff');
assert.ok(markIn, 'Step 3 morphing must contain .mark-morphing-in top mark');

// Open studio with 'คน' (rule: o_reduce - vowel reduction)
dom.window.ThaiVowelMorph.open('คน');
dom.window.ThaiVowelMorph.nextStep(); // to step 2
dom.window.ThaiVowelMorph.nextStep(); // to step 3

const evaporatingEl = stage.querySelector('.suffix-evaporating');
assert.ok(evaporatingEl, 'Step 3 vowel reduction must contain .suffix-evaporating element');

console.log('✅ Task 4 Smooth Phased Animation test passed!');
