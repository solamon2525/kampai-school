export const getFirstName = (fullName: string) =>
  fullName.trim().split(/\s+/)[0] || fullName.trim();

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

const readUnderMillion = (value: number): string => {
  if (value === 0) return '';
  const digits = String(value).padStart(6, '0').split('').map(Number);
  return digits.map((digit, index) => {
    if (digit === 0) return '';
    const place = 5 - index;
    if (place === 1 && digit === 1) return 'สิบ';
    if (place === 1 && digit === 2) return 'ยี่สิบ';
    if (place === 0 && digit === 1 && value > 10) return 'เอ็ด';
    return `${THAI_DIGITS[digit]}${THAI_PLACES[place]}`;
  }).join('');
};

export const thaiNumberToWords = (input: number): string => {
  if (!Number.isFinite(input)) return String(input);
  const value = Math.trunc(input);
  if (value === 0) return THAI_DIGITS[0];
  if (value < 0) return `ลบ${thaiNumberToWords(Math.abs(value))}`;
  if (value < 1_000_000) return readUnderMillion(value);
  return `${thaiNumberToWords(Math.floor(value / 1_000_000))}ล้าน${readUnderMillion(value % 1_000_000)}`;
};

export type ThaiSpeechStatus = 'completed' | 'unsupported' | 'cancelled' | 'error';

export interface ThaiSpeechResult {
  status: ThaiSpeechStatus;
  spoken: boolean;
}

interface SpeechJob {
  segments: string[];
  hadError: boolean;
  resolve: (result: ThaiSpeechResult) => void;
}

const speechQueue: SpeechJob[] = [];
let activeJob: SpeechJob | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeSegment = 0;
let generation = 0;

const normalizeSegments = (input: string | string[]) => (Array.isArray(input) ? input : [input])
  .flatMap((value) => value.split(/\s*[,;]\s*/u))
  .map((value) => value.trim())
  .filter(Boolean);

const finishActiveJob = (status: ThaiSpeechStatus) => {
  const completedJob = activeJob;
  activeJob = null;
  activeUtterance = null;
  activeSegment = 0;
  completedJob?.resolve({ status, spoken: status === 'completed' || status === 'error' });
  playNextJob();
};

const playCurrentSegment = () => {
  if (!activeJob || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    finishActiveJob('unsupported');
    return;
  }
  const segment = activeJob.segments[activeSegment];
  if (!segment) {
    finishActiveJob(activeJob.hadError ? 'error' : 'completed');
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(segment);
    activeUtterance = utterance;
    utterance.lang = 'th-TH';
    utterance.rate = 0.92;
    utterance.pitch = 1.02;
    const thaiVoice = window.speechSynthesis.getVoices()
      .find((voice) => voice.lang.toLocaleLowerCase().startsWith('th'));
    if (thaiVoice) utterance.voice = thaiVoice;
    const jobGeneration = generation;
    utterance.onend = () => {
      if (jobGeneration !== generation || activeUtterance !== utterance) return;
      activeUtterance = null;
      activeSegment += 1;
      playCurrentSegment();
    };
    utterance.onerror = () => {
      if (jobGeneration !== generation || activeUtterance !== utterance) return;
      activeUtterance = null;
      activeJob!.hadError = true;
      activeSegment += 1;
      playCurrentSegment();
    };
    window.speechSynthesis.speak(utterance);
  } catch {
    finishActiveJob('error');
  }
};

function playNextJob() {
  if (activeJob || speechQueue.length === 0) return;
  activeJob = speechQueue.shift() ?? null;
  activeSegment = 0;
  playCurrentSegment();
}

export const speakThai = (text: string | string[]): Promise<ThaiSpeechResult> => {
  const segments = normalizeSegments(text);
  if (segments.length === 0 || typeof window === 'undefined' ||
      !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.resolve({ status: 'unsupported', spoken: false });
  }
  return new Promise((resolve) => {
    speechQueue.push({ segments, hadError: false, resolve });
    playNextJob();
  });
};

export const stopThaiSpeech = () => {
  generation += 1;
  const active = activeJob;
  activeJob = null;
  activeUtterance = null;
  activeSegment = 0;
  active?.resolve({ status: 'cancelled', spoken: false });
  speechQueue.splice(0).forEach((job) => job.resolve({ status: 'cancelled', spoken: false }));
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
};
