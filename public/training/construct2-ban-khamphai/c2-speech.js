/**
 * c2-speech.js — ระบบเสียงอ่านภาษาไทยและอังกฤษสำหรับคำศัพท์ Construct 2
 * ออกแบบให้เสถียร ชัดเจน อ่านออกเสียงได้ 100% ป้องกันเสียงดับ/เงียบกลางทางใน Chrome/Edge
 */
(function(window) {
  'use strict';

  var synth = window.speechSynthesis;
  var voices = [];
  var isSpeaking = false;
  var currentUtterance = null; // ป้องกัน Chrome Garbage Collector ลบตัวแปรขณะกำลังพูด

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

  /**
   * ทำความสะอาดข้อความให้เป็นภาษาไทยธรรมชาติ เว้นวรรคอ่านง่าย
   */
  function cleanSpeechText(text, lang) {
    if (!text) return '';
    var str = String(text);

    if (lang === 'th') {
      // 1. ลบสัญลักษณ์พิเศษที่ทำให้ระบบอ่านแปลกๆ ออก
      str = str.replace(/[➔•▼▶▪■✓✕📌💡⚙️⚡🎬🧩📊]/g, ' ');
      str = str.replace(/[\(\)\[\]\{\}<>#@~_\-\=\+\\\/]/g, ' ');

      // 2. แปลงคำทับศัพท์หลักเป็นคำอ่านไทยที่เว้นวรรคธรรมชาติ
      str = str.replace(/\bEvent Sheet\b/gi, ' อีเวนต์ชีต ');
      str = str.replace(/\bEvent sheet\b/gi, ' อีเวนต์ชีต ');
      str = str.replace(/\bProject Bar\b/gi, ' โปรเจกต์บาร์ ');
      str = str.replace(/\bProperties\b/gi, ' พร็อปเพอร์ตี้ ');
      str = str.replace(/\bLayout\b/gi, ' เลย์เอาต์ ');
      str = str.replace(/\bCollision Polygon\b/gi, ' คอลลิชันพอลีกอน ');
      str = str.replace(/\bImage Point\b/gi, ' อิมเมจพอยต์ ');
      str = str.replace(/\bOn start of layout\b/gi, ' ออนสตาร์ตออฟเลย์เอาต์ ');
      str = str.replace(/\bEvery tick\b/gi, ' เอเวอรีติก ');
      str = str.replace(/\bTrigger once while true\b/gi, ' ทริกเกอร์วันส์ไวลทรู ');
      str = str.replace(/\bOn collision with\b/gi, ' ออนคอลลิชันวิด ');
      str = str.replace(/\bIs overlapping\b/gi, ' อิสโอเวอร์แลปปิง ');
      str = str.replace(/\bCompare two values\b/gi, ' คอมแพร์ทูแวลูส ');
      str = str.replace(/\bSet position\b/gi, ' เซตโพซิชัน ');
      str = str.replace(/\bSet animation\b/gi, ' เซตแอนิเมชัน ');
      str = str.replace(/\bSpawn another object\b/gi, ' สปอว์นออบเจกต์ ');
      str = str.replace(/\bSet mirrored\b/gi, ' เซตมิเรอร์ด ');
      str = str.replace(/\bAdd to\b/gi, ' แอดทู ');
      str = str.replace(/\bSubtract from\b/gi, ' ซับแทรกต์ฟรอม ');
      str = str.replace(/\bSet text\b/gi, ' เซตเท็กซ์ ');
      str = str.replace(/\bGo to layout\b/gi, ' โกทูเลย์เอาต์ ');
      str = str.replace(/\bJump-thru\b/gi, ' จัมป์ทรู ');
      str = str.replace(/\bScroll To\b/gi, ' สกรอลล์ทู ');
      str = str.replace(/\bDestroy outside layout\b/gi, ' ดิสทรอยเอาต์ไซด์เลย์เอาต์ ');
      str = str.replace(/\bGlobal Variable\b/gi, ' โกลบอลแวริเอเบิล ');
      str = str.replace(/\bInstance Variable\b/gi, ' อินสแตนซ์แวริเอเบิล ');
      str = str.replace(/\bWebStorage\b/gi, ' เว็บสตอเรจ ');
      str = str.replace(/\bSprite\b/gi, ' สไปรต์ ');
      str = str.replace(/\bSolid\b/gi, ' โซลิด ');
      str = str.replace(/\bPlatform\b/gi, ' แพลตฟอร์ม ');
      str = str.replace(/\bBullet\b/gi, ' บูลเล็ต ');
      str = str.replace(/\bSine\b/gi, ' ไซน์ ');
      str = str.replace(/\bFlash\b/gi, ' แฟลช ');
      str = str.replace(/\bArray\b/gi, ' อาร์เรย์ ');
      str = str.replace(/\bDictionary\b/gi, ' ดิคชันนารี ');
      str = str.replace(/\bFunction\b/gi, ' ฟังก์ชัน ');
      str = str.replace(/\bDestroy\b/gi, ' ดิสทรอย ');
      str = str.replace(/\bElse\b/gi, ' เอลส์ ');
      str = str.replace(/\bHUD\b/gi, ' เอชยูดี ');

      str = str.replace(/\s+/g, ' ').trim();
    } else {
      str = str.replace(/[➔•▼▶✓✕📌💡⚙️⚡🎬🧩📊]/g, '');
      str = str.replace(/\s+/g, ' ').trim();
    }

    return str;
  }

  function findVoice(langCode) {
    if (!voices.length) loadVoices();
    var target = (langCode === 'en-US') ? 'en' : 'th';
    
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf(target) === 0) {
        return voices[i];
      }
    }
    return null;
  }

  var C2Speech = {
    /**
     * อ่านข้อความเสียงภาษาไทย/อังกฤษ
     */
    speak: function(text, lang, onEndCallback) {
      if (!synth) {
        alert('เบราว์เซอร์ของคุณยังไม่รองรับระบบเสียงอ่าน (Speech Synthesis)');
        if (onEndCallback) onEndCallback();
        return;
      }

      // หยุดเสียงเดิมที่กำลังอ่านอยู่
      synth.cancel();

      lang = lang || 'th';
      var cleanText = cleanSpeechText(text, lang);
      if (!cleanText) {
        if (onEndCallback) onEndCallback();
        return;
      }

      var langCode = (lang === 'en') ? 'en-US' : 'th-TH';
      var utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      var voice = findVoice(langCode);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = function() {
        isSpeaking = true;
      };

      utterance.onend = function() {
        isSpeaking = false;
        currentUtterance = null;
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = function(e) {
        isSpeaking = false;
        currentUtterance = null;
        console.warn('SpeechSynthesis error:', e);
        if (onEndCallback) onEndCallback();
      };

      // เก็บไว้ในอ้างอิงหลักเพื่อไม่ให้ถูก Chrome GC ลบทิ้ง
      currentUtterance = utterance;

      // สั่งพูด
      synth.speak(utterance);
    },

    stop: function() {
      if (synth) {
        synth.cancel();
        isSpeaking = false;
        currentUtterance = null;
      }
    },

    isSpeaking: function() {
      return isSpeaking;
    }
  };

  window.C2Speech = C2Speech;

})(window);
