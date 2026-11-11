import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const battleCityDir = path.resolve('public/games/thai/battle-city');
const indexPath = path.join(battleCityDir, 'index.html');
const stylePath = path.join(battleCityDir, 'style.css');
const dataPath = path.join(battleCityDir, 'data.js');
const gamePath = path.join(battleCityDir, 'game.js');

test('battle-city: index.html imports /games/kampai-sdk.js', () => {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert.match(indexHtml, /<script\s+src=["']\/games\/kampai-sdk\.js["']>/, 'Must include kampai-sdk.js');
});

test('battle-city: index.html has back button and light mode styling', () => {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert.match(indexHtml, /id=["']btn-back["']/, 'Must include back button (#btn-back)');
  assert.doesNotMatch(indexHtml, /#0b0f19/, 'Must not have hardcoded dark #0b0f19 background');
});

test('battle-city: style.css does not have hardcoded dark body background', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  assert.doesNotMatch(css, /background-color:\s*#0b0f19/, 'style.css must not use #0b0f19 dark background');
});

test('battle-city: data.js contains Thai curriculum vocabulary and no English words', () => {
  const dataJs = fs.readFileSync(dataPath, 'utf8');
  assert.doesNotMatch(dataJs, /"WIN"/, 'Must not contain English word WIN');
  assert.doesNotMatch(dataJs, /"PLAY"/, 'Must not contain English word PLAY');
  assert.doesNotMatch(dataJs, /"TANK"/, 'Must not contain English word TANK');
  assert.doesNotMatch(dataJs, /"BATTLE"/, 'Must not contain English word BATTLE');
  
  // Must contain Thai words suitable for Grade 4-6 spelling
  assert.match(dataJs, /"กนก"/, 'Must contain Thai word กนก');
  assert.match(dataJs, /"มงคล"/, 'Must contain Thai word มงคล');
  assert.match(dataJs, /"อดทน"/, 'Must contain Thai word อดทน');
});

test('battle-city: game.js calls KAMPAI.submitScore and KAMPAI.beginRound', () => {
  const gameJs = fs.readFileSync(gamePath, 'utf8');
  assert.match(gameJs, /KAMPAI\s*\.\s*submitScore\s*\(/, 'Must call KAMPAI.submitScore');
  assert.match(gameJs, /KAMPAI\s*\.\s*beginRound\s*\(/, 'Must call KAMPAI.beginRound');
});
