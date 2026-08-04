/**
 * c2-speech.js — ระบบเสียงอ่านภาษาไทยและอังกฤษสำหรับคำศัพท์ Construct 2
 * ใช้ Web Speech API (speechSynthesis) แบบ Native บนเบราว์เซอร์
 */
(function(window) {
  'use strict';

  var synth = window.speechSynthesis;
  var voices = [];
  var isSpeaking = false;

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices() || [];
  }

  if (synth) {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }

  function findVoice(langPrefix) {
    if (!voices.length) loadVoices();
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf(langPrefix.toLowerCase()) === 0) {
        return voices[i];
      }
    }
    return null;
  }

  var C2Speech = {
    /**
     * อ่านข้อความภาษาไทยหรืออังกฤษ
     * @param {string} text - ข้อความที่จะอ่าน
     * @param {string} lang - 'th' หรือ 'en' (default: 'th')
     * @param {function} onEndCallback - ทำงานเมื่ออ่านจบ
     */
    speak: function(text, lang, onEndCallback) {
      if (!synth) {
        alert('เบราว์เซอร์ของคุณยังไม่รองรับระบบเสียงอ่าน (Speech Synthesis)');
        if (onEndCallback) onEndCallback();
        return;
      }

      // ยกเลิกเสียงที่กำลังอ่านอยู่ก่อนหน้า
      synth.cancel();

      lang = lang || 'th';
      var langCode = (lang === 'en') ? 'en-US' : 'th-TH';
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = (lang === 'en') ? 0.9 : 0.95; // ความเร็วอ่านพอดีๆ
      utterance.pitch = 1.0;

      var voice = findVoice(lang === 'en' ? 'en' : 'th');
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = function() {
        isSpeaking = true;
      };

      utterance.onend = function() {
        isSpeaking = false;
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = function(e) {
        isSpeaking = false;
        console.warn('Speech error:', e);
        if (onEndCallback) onEndCallback();
      };

      synth.speak(utterance);
    },

    stop: function() {
      if (synth) {
        synth.cancel();
        isSpeaking = false;
      }
    },

    isSpeaking: function() {
      return isSpeaking;
    }
  };

  window.C2Speech = C2Speech;

})(window);
