import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/games/english/vocab-hub.html', import.meta.url), 'utf8');
const audio = html.slice(html.indexOf('let enVoice = null, thVoice = null;'), html.indexOf('let actx = null;'));
assert.ok(audio.length > 1000, 'audio controller found');

const spoken = [];
const notices = [];
let canceled = 0;
let availableVoices = [{ lang: 'en-US', name: 'English' }, { lang: 'th-TH', name: 'Thai' }];
let voicesChanged;
class Utterance {
  constructor(text) { this.text = text; }
}
const speechSynthesis = {
  getVoices: () => availableVoices,
  addEventListener: (name, listener) => { if (name === 'voiceschanged') voicesChanged = listener; },
  cancel: () => { canceled++; },
  speak: utterance => { spoken.push(utterance); },
};
const context = vm.createContext({
  window: { speechSynthesis }, speechSynthesis, SpeechSynthesisUtterance: Utterance,
  currentSlug: 'fruits', voiceMode: 'en', setTimeout, clearTimeout,
  toast: (...args) => notices.push(args),
});
vm.runInContext(audio, context);
const apple = { en: 'Apple', th: 'แอปเปิล', meaning: 'ผลไม้' };
const banana = { en: 'Banana', th: 'บานานา', meaning: 'กล้วย' };
context.apple = apple;
context.banana = banana;

vm.runInContext('speak(apple)', context);
assert.equal(spoken.length, 1, 'tap starts speech in the same task');
vm.runInContext('speak(apple)', context);
assert.equal(spoken.length, 2, 'repeated tap speaks again');

vm.runInContext('voiceMode = "both"; speak(apple)', context);
const stale = spoken.at(-1);
vm.runInContext('speak(banana)', context);
const count = spoken.length;
stale.onerror?.({ error: 'canceled' });
await new Promise(resolve => setTimeout(resolve, 220));
assert.equal(spoken.length, count, 'canceled older request cannot queue Thai');
assert.equal(notices.length, 0, 'cancellation does not show a failure notice');

const active = spoken.at(-1);
active.onerror?.({ error: 'voice-unavailable' });
assert.equal(spoken.length, count + 1, 'unavailable selected voice retries once');
assert.equal(spoken.at(-1).voice, undefined, 'retry uses default language voice');
spoken.at(-1).onerror?.({ error: 'audio-busy' });
assert.equal(notices.length, 1, 'final synthesis error is visible');
assert.equal(spoken.length, count + 1, 'failed default voice is not retried forever');

vm.runInContext('voiceMode = "th"; speak(apple)', context);
assert.equal(spoken.at(-1).lang, 'th-TH', 'Thai mode selects Thai speech');
vm.runInContext('voiceMode = "both"; speak(apple)', context);
const english = spoken.at(-1);
assert.equal(english.lang, 'en-US');
english.onend?.();
await new Promise(resolve => setTimeout(resolve, 220));
assert.equal(spoken.at(-1).lang, 'th-TH', 'combined mode reads Thai after English');

vm.runInContext('voiceMode = "en"; speak(banana)', context);
const outdated = spoken.at(-1);
vm.runInContext('cancelSpeech()', context);
outdated.onend?.();
assert.equal(spoken.at(-1), outdated, 'stopped request cannot continue');

availableVoices = [];
voicesChanged();
vm.runInContext('speak(apple)', context);
assert.equal(spoken.at(-1).voice, undefined, 'late voice loading uses browser default');
availableVoices = [{ lang: 'en-US', name: 'Loaded English' }];
voicesChanged();
vm.runInContext('speak(apple)', context);
assert.equal(spoken.at(-1).voice.name, 'Loaded English', 'newly loaded voice is picked up');
assert.ok(canceled >= 3);
console.log('Vocabulary Hub speech controller: pass');
