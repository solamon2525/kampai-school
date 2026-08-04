/**
 * c2-speech.js — ระบบเสียงอ่านภาษาไทยและอังกฤษสำหรับคำศัพท์ Construct 2
 * ปรับแต่งพิเศษเพื่อความต่อเนื่อง ลื่นไหล ไม่สะดุด ไม่ตัดคำกลางทาง
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

  /**
   * แปลงคำศัพท์ภาษาอังกฤษในข้อความไทยเป็นคำอ่านภาษาไทย เพื่อให้เสียงพากย์ไทยอ่านลื่นไหล ไม่หยุดชะงัก
   */
  function normalizeTextForSpeech(text, lang) {
    if (!text) return '';
    var str = String(text);

    if (lang === 'th') {
      // 1. ลบสัญลักษณ์และสัญลักษณ์พิเศษที่ทำให้เครื่องเสียงสะดุด
      str = str.replace(/[➔➔•▼▶▪■✓✕📌💡⚙️⚡🎬🧩📊คำสั่งประเภท:]/g, ' ');
      str = str.replace(/[\(\)\[\]\{\}<>#@~_\-\=\+\\\/]/g, ' ');

      // 2. แปลงคำทับศัพท์ C2 ภาษาอังกฤษเป็นคำอ่านภาษาไทยเป๊ะๆ
      var phoneticMap = [
        [/\bEvent Sheet\b/gi, 'อีเวนต์ชีต'],
        [/\bEvent sheets\b/gi, 'อีเวนต์ชีต'],
        [/\bEvent sheet\b/gi, 'อีเวนต์ชีต'],
        [/\bProject Bar\b/gi, 'โปรเจกต์บาร์'],
        [/\bProperties panel\b/gi, 'พร็อปเพอร์ตี้พาเนล'],
        [/\bProperties\b/gi, 'พร็อปเพอร์ตี้'],
        [/\bLayouts\b/gi, 'เลย์เอาต์'],
        [/\bLayout\b/gi, 'เลย์เอาต์'],
        [/\bCollision Polygon\b/gi, 'คอลลิชันพอลีกอน'],
        [/\bImage Point\b/gi, 'อิมเมจพอยต์'],
        [/\bOn start of layout\b/gi, 'ออนสตาร์ตออฟเลย์เอาต์'],
        [/\bEvery tick\b/gi, 'เอเวอรีติก'],
        [/\bTrigger once while true\b/gi, 'ทริกเกอร์วันส์ไวลทรู'],
        [/\bTrigger once\b/gi, 'ทริกเกอร์วันส์'],
        [/\bOn collision with\b/gi, 'ออนคอลลิชันวิด'],
        [/\bIs overlapping another object\b/gi, 'อิสโอเวอร์แลปปิง'],
        [/\bIs overlapping\b/gi, 'อิสโอเวอร์แลปปิง'],
        [/\bCompare two values\b/gi, 'คอมแพร์ทูแวลูส'],
        [/\bSet position\b/gi, 'เซตโพซิชัน'],
        [/\bSet animation\b/gi, 'เซตแอนิเมชัน'],
        [/\bSpawn another object\b/gi, 'สปอว์นออบเจกต์'],
        [/\bSet mirrored\b/gi, 'เซตมิเรอร์ด'],
        [/\bSet not mirrored\b/gi, 'เซตนอตมิเรอร์ด'],
        [/\bAdd to\b/gi, 'แอดทู'],
        [/\bSubtract from\b/gi, 'ซับแทรกต์ฟรอม'],
        [/\bSet text\b/gi, 'เซตเท็กซ์'],
        [/\bGo to layout\b/gi, 'โกทูเลย์เอาต์'],
        [/\bJump-thru\b/gi, 'จัมป์ทรู'],
        [/\bJump thru\b/gi, 'จัมป์ทรู'],
        [/\bScroll To\b/gi, 'สกรอลล์ทู'],
        [/\bDestroy outside layout\b/gi, 'ดิสทรอยเอาต์ไซด์เลย์เอาต์'],
        [/\bGlobal Variable\b/gi, 'โกลบอลแวริเอเบิล'],
        [/\bInstance Variable\b/gi, 'อินสแตนซ์แวริเอเบิล'],
        [/\bInstance variables\b/gi, 'อินสแตนซ์แวริเอเบิล'],
        [/\bWebStorage\b/gi, 'เว็บสตอเรจ'],
        [/\bCondition\b/gi, 'คอนดิชัน'],
        [/\bConditions\b/gi, 'คอนดิชัน'],
        [/\bAction\b/gi, 'แอ็กชัน'],
        [/\bActions\b/gi, 'แอ็กชัน'],
        [/\bBehavior\b/gi, 'บีเฮฟเวียร์'],
        [/\bBehaviors\b/gi, 'บีเฮฟเวียร์'],
        [/\bVariable\b/gi, 'แวริเอเบิล'],
        [/\bVariables\b/gi, 'แวริเอเบิล'],
        [/\bSprite\b/gi, 'สไปรต์'],
        [/\bSolid\b/gi, 'โซลิด'],
        [/\bPlatform\b/gi, 'แพลตฟอร์ม'],
        [/\bBullet\b/gi, 'บูลเล็ต'],
        [/\bSine\b/gi, 'ไซน์'],
        [/\bFlash\b/gi, 'แฟลช'],
        [/\bArray\b/gi, 'อาร์เรย์'],
        [/\bDictionary\b/gi, 'ดิคชันนารี'],
        [/\bFunction\b/gi, 'ฟังก์ชัน'],
        [/\bParallax\b/gi, 'พารัลแลกซ์'],
        [/\bDestroy\b/gi, 'ดิสทรอย'],
        [/\bElse\b/gi, 'เอลส์'],
        [/\bHUD\b/gi, 'เอชยูดี'],
        [/\bFPS\b/gi, 'เอฟพีเอส'],
        [/\bJSON\b/gi, 'เจสัน'],
        [/\bC2\b/gi, 'ซีสอง'],
        [/\bF5\b/gi, 'เอฟห้า'],
        [/\bX\s*,\s*Y\b/gi, 'เอ็กซ์ และ วาย'],
        [/\bX\b/gi, 'เอ็กซ์'],
        [/\bY\b/gi, 'วาย'],
        [/\bNumber\b/gi, 'นัมเบอร์'],
        [/\bText\b/gi, 'เท็กซ์'],
        [/\bBoolean\b/gi, 'บูลีน']
      ];

      for (var i = 0; i < phoneticMap.length; i++) {
        str = str.replace(phoneticMap[i][0], phoneticMap[i][1]);
      }

      // 3. กำจัดช่องว่างซ้ำซ้อนให้กระชับ
      str = str.replace(/\s+/g, ' ').trim();
    } else {
      // ภาษาอังกฤษ: Clean up characters
      str = str.replace(/[➔•▼▶✓✕📌💡⚙️⚡🎬🧩📊]/g, '');
      str = str.replace(/\s+/g, ' ').trim();
    }

    return str;
  }

  function findVoice(langPrefix) {
    if (!voices.length) loadVoices();
    var voiceList = voices.filter(function(v) {
      return v.lang && v.lang.toLowerCase().indexOf(langPrefix.toLowerCase()) === 0;
    });

    if (!voiceList.length) return null;

    // ชอบเสียงพากย์ธรรมชาติ (Google / Microsoft)
    for (var i = 0; i < voiceList.length; i++) {
      var name = voiceList[i].name.toLowerCase();
      if (name.indexOf('google') !== -1 || name.indexOf('natural') !== -1 || name.indexOf('online') !== -1) {
        return voiceList[i];
      }
    }
    return voiceList[0];
  }

  var C2Speech = {
    /**
     * อ่านข้อความภาษาไทยหรืออังกฤษแบบลื่นไหล
     */
    speak: function(text, lang, onEndCallback) {
      if (!synth) {
        console.warn('SpeechSynthesis is not supported');
        if (onEndCallback) onEndCallback();
        return;
      }

      lang = lang || 'th';
      var cleanText = normalizeTextForSpeech(text, lang);
      if (!cleanText) {
        if (onEndCallback) onEndCallback();
        return;
      }

      // ป้องกันการสะดุด หยุดเสียงเดิมก่อน
      synth.cancel();

      // แยกประโยคย่อยด้วยเครื่องหมายจุด หรือเว้นวรรคยาว เพื่อให้อ่านประโยคต่อเนื่องไม่หลุดคิว
      var sentences = cleanText.split(/[\.\n]/).filter(function(s) { return s.trim().length > 0; });
      if (!sentences.length) sentences = [cleanText];

      var index = 0;

      function speakNextSentence() {
        if (index >= sentences.length) {
          isSpeaking = false;
          if (onEndCallback) onEndCallback();
          return;
        }

        var sentenceText = sentences[index].trim();
        index++;

        var utterance = new SpeechSynthesisUtterance(sentenceText);
        utterance.lang = (lang === 'en') ? 'en-US' : 'th-TH';
        utterance.rate = (lang === 'en') ? 0.95 : 1.02; // อัตราความเร็วธรรมชาติ อ่านกระชับต่อเนื่อง
        utterance.pitch = 1.0;

        var voice = findVoice(lang === 'en' ? 'en' : 'th');
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = function() {
          isSpeaking = true;
        };

        utterance.onend = function() {
          speakNextSentence();
        };

        utterance.onerror = function(e) {
          console.warn('Utterance speech error:', e);
          speakNextSentence();
        };

        // Delay เล็กน้อย 50ms ระหว่างประโยคเพื่อความต่อเนื่องสละสลวย
        setTimeout(function() {
          synth.speak(utterance);
        }, 40);
      }

      speakNextSentence();
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
