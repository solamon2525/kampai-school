import assert from 'node:assert/strict';

const spoken = [];
class MockUtterance {
  constructor(text) {
    this.text = text;
    this.onend = null;
    this.onerror = null;
  }
}

globalThis.window = {
  speechSynthesis: {
    getVoices: () => [{ lang: 'th-TH' }],
    speak: (utterance) => {
      spoken.push(utterance.text);
      setTimeout(() => {
        if (utterance.text === 'ช่วงผิดพลาด') utterance.onerror?.(new Event('error'));
        else utterance.onend?.(new Event('end'));
      }, 0);
    },
    cancel: () => { throw new Error('normal queue must not call cancel'); },
  },
};
globalThis.SpeechSynthesisUtterance = MockUtterance;

const { speakThai, thaiNumberToWords } = await import('../src/lib/thaiSpeech.ts');

assert.deepEqual(
  [0, 11, 21, 101, 1300, 10001, 1000000].map(thaiNumberToWords),
  ['ศูนย์', 'สิบเอ็ด', 'ยี่สิบเอ็ด', 'หนึ่งร้อยเอ็ด', 'หนึ่งพันสามร้อย', 'หนึ่งหมื่นเอ็ด', 'หนึ่งล้าน'],
);

const first = speakThai(['รายการหนึ่ง', 'หนึ่งพันสามร้อยบาท']);
const second = speakThai(['ช่วงผิดพลาด', 'รายการสองยังอ่านต่อ']);
const [firstResult, secondResult] = await Promise.all([first, second]);

assert.equal(firstResult.status, 'completed');
assert.equal(secondResult.status, 'error');
assert.equal(secondResult.spoken, true);
assert.deepEqual(spoken, ['รายการหนึ่ง', 'หนึ่งพันสามร้อยบาท', 'ช่วงผิดพลาด', 'รายการสองยังอ่านต่อ']);

delete globalThis.window;
assert.deepEqual(await speakThai('ไม่มี API'), { status: 'unsupported', spoken: false });

console.log('thaiSpeech: number words, retained sequential utterances, FIFO, error recovery, and fallback passed');
