export const getFirstName = (fullName: string) =>
  fullName.trim().split(/\s+/)[0] || fullName.trim();

export const speakThai = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.92;
    utterance.pitch = 1.02;
    const thaiVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLocaleLowerCase().startsWith('th'));
    if (thaiVoice) utterance.voice = thaiVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Voice feedback is optional and must never block a successful record.
  }
};
