import fs from 'node:fs';
import path from 'node:path';
import { MODULES } from './data-grammar-modules.mjs';
import { STORIES, SYNTAX_DATA, FIXER_DATA, QUIZ_QUESTIONS } from './data-grammar-stories.mjs';

const htmlTemplate = `<!DOCTYPE html>
<html lang="th">
<head>
  <script src="/games/kampai-sdk.js"></script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Grammar & Vocab Studio (ป.4–ป.5) — โรงเรียนบ้านคำไผ่</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --indigo: #4338ca;
      --indigo-dark: #312e81;
      --indigo-light: #eef2ff;
      --mint: #10b981;
      --mint-light: #ecfdf5;
      --gold: #f59e0b;
      --gold-light: #fffbeb;
      --navy: #0f172a;
      --border: #cbd5e1;
      --line: #c7d2fe;
      --muted: #475569;
      --card-bg: #ffffff;
      --ok: #059669;
      --bad: #e11d48;
      --sub-color: #2563eb;
      --verb-color: #ea580c;
      --obj-color: #059669;
      --prep-color: #7c3aed;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      max-width: 100%;
      overflow-x: hidden;
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(150deg, #eef2ff 0%, #f0fdf4 50%, #fef9c3 100%);
      min-height: 100vh;
      color: var(--navy);
      -webkit-tap-highlight-color: transparent;
    }

    .shell {
      max-width: 1100px;
      margin: 0 auto;
      background: var(--card-bg);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
      overflow-x: hidden;
      width: 100%;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6366f1 100%);
      color: #ffffff;
    }
    .header-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    header h1 { font-size: 1.15rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 6px; }
    .badge-grade {
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(245, 158, 11, 0.25);
      border: 1px solid rgba(245, 158, 11, 0.6);
      color: #fde047;
      padding: 3px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .btn-hdr {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      min-width: 44px;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn-hdr:hover { background: rgba(255, 255, 255, 0.25); }

    /* VOICE CONTROLS IN HEADER */
    .hdr-select {
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #ffffff;
      padding: 8px 10px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      min-height: 44px;
      outline: none;
      cursor: pointer;
    }
    .hdr-select option {
      background: #ffffff;
      color: var(--navy);
    }

    /* NAVIGATION TABS */
    nav.nav-tabs {
      display: flex;
      background: #f8fafc;
      border-bottom: 2px solid var(--border);
      overflow-x: auto;
      scrollbar-width: none;
      padding: 6px 10px;
      gap: 6px;
    }
    nav.nav-tabs::-webkit-scrollbar { display: none; }
    .tab-btn {
      flex: 1 0 auto;
      min-width: 130px;
      min-height: 44px;
      padding: 10px 14px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: inherit;
      font-size: 0.92rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: rgba(67, 56, 202, 0.08);
      color: var(--indigo);
    }
    .tab-btn.active {
      background: var(--indigo);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(67, 56, 202, 0.25);
    }

    /* CONTENT SECTIONS */
    main.content {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* MODULE SELECTOR */
    .module-selector {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: none;
    }
    .module-selector::-webkit-scrollbar { display: none; }
    .btn-mod {
      flex: 0 0 auto;
      min-height: 44px;
      padding: 8px 16px;
      background: var(--indigo-light);
      border: 1px solid var(--line);
      color: var(--indigo-dark);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-mod.active {
      background: var(--indigo-dark);
      color: #ffffff;
      border-color: var(--indigo-dark);
    }

    /* FORMULA & RULE CARD */
    .formula-banner {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border: 2px solid var(--line);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .formula-banner h2 {
      font-size: 1.25rem;
      color: var(--indigo-dark);
      font-weight: 800;
      margin-bottom: 6px;
    }
    .formula-desc {
      color: var(--navy);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .formula-box {
      background: #ffffff;
      border-left: 4px solid var(--indigo);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.95rem;
      color: var(--indigo-dark);
      line-height: 1.6;
    }

    /* VISUAL EXAMPLE CARDS GRID */
    .example-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 16px;
    }
    .example-card {
      background: #ffffff;
      border: 2px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .example-card:hover {
      transform: translateY(-2px);
      border-color: var(--line);
      box-shadow: 0 8px 20px rgba(67, 56, 202, 0.1);
    }
    .ex-img-wrapper {
      width: 100%;
      height: 190px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border-bottom: 1px solid var(--border);
    }
    .ex-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 10px;
      transition: transform 0.2s ease;
    }
    .example-card:hover .ex-img {
      transform: scale(1.04);
    }
    .ex-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(49, 46, 129, 0.9);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      backdrop-filter: blur(4px);
    }
    .ex-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
      gap: 10px;
    }
    .ex-sentence {
      font-size: 1.12rem;
      font-weight: 700;
      color: var(--indigo-dark);
      line-height: 1.4;
    }
    .ex-translation {
      font-size: 0.92rem;
      color: var(--muted);
      line-height: 1.4;
    }
    .ex-rule-note {
      background: var(--mint-light);
      border-left: 3px solid var(--mint);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 0.85rem;
      color: #065f46;
      line-height: 1.4;
    }
    .ex-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 4px;
    }
    .grammar-token {
      background: #fef08a;
      color: #854d0e;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #facc15;
      font-weight: 800;
    }

    /* ACTION BUTTONS */
    .btn-act {
      min-height: 44px;
      padding: 8px 14px;
      border-radius: 8px;
      border: none;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-act.primary {
      background: var(--indigo);
      color: #ffffff;
    }
    .btn-act.primary:hover { background: var(--indigo-dark); }
    .btn-act.secondary {
      background: var(--indigo-light);
      color: var(--indigo-dark);
      border: 1px solid var(--line);
    }
    .btn-act.secondary:hover { background: #e0e7ff; }
    .btn-act.accent {
      background: var(--gold);
      color: #ffffff;
    }
    .btn-act.accent:hover { background: #d97706; }

    /* STORYBOARD CONTINUOUS MODE */
    .story-nav {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: none;
      margin-bottom: 12px;
    }
    .story-nav::-webkit-scrollbar { display: none; }
    .btn-story {
      flex: 0 0 auto;
      min-height: 44px;
      padding: 8px 16px;
      background: #f1f5f9;
      border: 1px solid var(--border);
      color: var(--navy);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-story.active {
      background: var(--indigo-dark);
      color: #ffffff;
      border-color: var(--indigo-dark);
    }

    .story-theater {
      background: #ffffff;
      border: 2px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* STORY PROGRESS BAR / STEPS */
    .story-steps {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .step-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--muted);
    }
    .step-dots {
      display: flex;
      gap: 6px;
    }
    .step-dot {
      width: 24px;
      height: 8px;
      border-radius: 4px;
      background: var(--border);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .step-dot.active {
      background: var(--indigo);
      width: 40px;
    }

    /* SCENE DISPLAY */
    .scene-viewport {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: center;
    }
    @media (max-width: 768px) {
      .scene-viewport {
        grid-template-columns: 1fr;
      }
    }
    .scene-art-box {
      width: 100%;
      height: 280px;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
      border: 2px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .scene-art-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 16px;
    }
    .scene-badge-corner {
      position: absolute;
      top: 12px;
      left: 12px;
      background: var(--gold);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 4px 10px;
      border-radius: 999px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .scene-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .scene-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--indigo-dark);
    }
    .scene-sentence-en {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--navy);
      line-height: 1.35;
    }
    .scene-sentence-th {
      font-size: 1.05rem;
      font-weight: 500;
      color: var(--muted);
      line-height: 1.4;
    }
    .scene-rule-callout {
      background: var(--gold-light);
      border-left: 4px solid var(--gold);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.92rem;
      color: #92400e;
      line-height: 1.45;
    }

    /* STORY FILMSTRIP THUMBNAILS */
    .story-filmstrip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    @media (max-width: 600px) {
      .story-filmstrip {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .film-card {
      border: 2px solid var(--border);
      border-radius: 10px;
      padding: 6px;
      background: #ffffff;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-height: 44px;
    }
    .film-card.active {
      border-color: var(--indigo);
      background: var(--indigo-light);
      box-shadow: 0 4px 10px rgba(67, 56, 202, 0.15);
    }
    .film-thumb {
      width: 100%;
      height: 60px;
      object-fit: contain;
    }
    .film-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--navy);
    }

    /* SYNTAX INSPECTOR */
    .syntax-card {
      background: #ffffff;
      border: 2px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .syntax-tokens-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px dashed var(--line);
    }
    .syntax-token {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      min-height: 54px;
      font-weight: 800;
      font-size: 1.15rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      color: #ffffff;
    }
    .syntax-token:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .syntax-token.sub { background: var(--sub-color); }
    .syntax-token.verb { background: var(--verb-color); }
    .syntax-token.obj { background: var(--obj-color); }
    .syntax-token.prep { background: var(--prep-color); }
    .syntax-token.art { background: #64748b; }
    .syntax-token .token-label {
      font-size: 0.72rem;
      font-weight: 600;
      opacity: 0.9;
      margin-top: 2px;
    }

    /* FIXER LAB */
    .fixer-card {
      background: #ffffff;
      border: 2px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .fixer-wrong-box {
      background: #fff1f2;
      border: 2px dashed #fda4af;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }
    .fixer-wrong-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: #be123c;
      text-decoration: line-through;
    }
    .fixer-hint {
      font-size: 0.92rem;
      color: #9f1239;
      margin-top: 6px;
    }

    /* QUIZ MODE */
    .quiz-card {
      background: #ffffff;
      border: 2px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .quiz-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
    }
    .quiz-score-badge {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--indigo-dark);
      background: var(--indigo-light);
      padding: 4px 12px;
      border-radius: 999px;
    }
    .opt-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    @media (min-width: 600px) {
      .opt-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .opt-btn {
      min-height: 48px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 2px solid var(--border);
      background: #ffffff;
      color: var(--navy);
      font-family: inherit;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .opt-btn:hover {
      border-color: var(--indigo);
      background: var(--indigo-light);
    }
    .opt-btn.correct {
      border-color: var(--ok);
      background: #ecfdf5;
      color: var(--ok);
    }
    .opt-btn.wrong {
      border-color: var(--bad);
      background: #fff1f2;
      color: var(--bad);
    }
    .quiz-feedback {
      border-radius: 10px;
      padding: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.4;
      display: none;
    }
    .quiz-feedback.show { display: block; }
    .quiz-feedback.correct {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .quiz-feedback.wrong {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #9f1239;
    }

    /* FOOTER */
    footer {
      margin-top: auto;
      padding: 14px 16px;
      background: #f8fafc;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.85rem;
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .footer-links a {
      color: var(--indigo);
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
<div class="shell">
  <header>
    <div class="header-left">
      <h1>📚 Grammar & Vocab Studio</h1>
      <span class="badge-grade">ป.4–ป.5 ไวยากรณ์และคำศัพท์</span>
    </div>
    <div class="header-right">
      <select id="selVoiceAccent" class="hdr-select" title="เลือกสำเนียงเสียงอ่าน">
        <option value="en-US">🇺🇸 US English (สหรัฐฯ)</option>
        <option value="en-GB">🇬🇧 UK English (อังกฤษ)</option>
      </select>
      <button id="btnAudioToggle" class="btn-hdr" title="เปิด/ปิดเสียงบรรยาย">
        <span id="audioIcon">🔊</span>
        <span id="audioLabel">เปิดเสียง</span>
      </button>
      <button id="btnFullscreen" class="btn-hdr" title="เต็มจอ (Smartboard)">
        <span>⛶</span>
      </button>
      <a href="/games/english/grammar-vocab-worksheet.html" target="_blank" class="btn-hdr" style="background: rgba(245, 158, 11, 0.25); border-color: rgba(245, 158, 11, 0.6); color: #fde047;">
        📄 ใบงาน A4
      </a>
    </div>
  </header>

  <nav class="nav-tabs">
    <button class="tab-btn active" data-tab="studio">📖 Grammar Studio</button>
    <button class="tab-btn" data-tab="story">🎬 Sequential Storyboard</button>
    <button class="tab-btn" data-tab="syntax">🔍 Syntax Inspector</button>
    <button class="tab-btn" data-tab="fixer">🛠️ Fixer Lab</button>
    <button class="tab-btn" data-tab="quiz">✏️ Practice Quiz</button>
  </nav>

  <main class="content">
    <!-- TAB 1: GRAMMAR STUDIO -->
    <section id="tab-studio" class="tab-content active">
      <div class="module-selector" id="moduleNav"></div>
      <div id="formulaContainer"></div>
      <div class="example-grid" id="exampleGrid"></div>
    </section>

    <!-- TAB 2: SEQUENTIAL STORYBOARD -->
    <section id="tab-story" class="tab-content">
      <div class="story-nav" id="storyNav"></div>
      <div class="story-theater">
        <div class="story-steps">
          <div class="step-badge" id="storyBadge">ฉากที่ 1 / 4</div>
          <div class="step-dots" id="storyDots"></div>
        </div>

        <div class="scene-viewport">
          <div class="scene-art-box">
            <span class="scene-badge-corner" id="sceneBadge">Article: an</span>
            <img id="sceneImg" class="scene-art-img" src="" alt="ภาพประกอบฉาก" />
          </div>
          <div class="scene-details">
            <div class="scene-title" id="sceneTitle">ฉากที่ 1</div>
            <div class="scene-sentence-en" id="sceneSentenceEn">Sentence</div>
            <div class="scene-sentence-th" id="sceneSentenceTh">คำแปลภาษาไทย</div>
            <div class="scene-rule-callout" id="sceneRuleCallout">คำอธิบายไวยากรณ์</div>
            <div class="ex-actions">
              <button id="btnSpeakScene" class="btn-act primary">🔊 ฟังประโยค</button>
              <button id="btnEchoScene" class="btn-act secondary">🎤 ฝึกพูดตาม</button>
              <button id="btnAutoPlayStory" class="btn-act accent">⏯ เล่นนิทานต่อเนื่อง</button>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <button id="btnPrevScene" class="btn-act secondary">◀ ฉากก่อนหน้า</button>
          <span id="storyAutoStatus" style="font-size:0.85rem; font-weight:700; color:var(--indigo);"></span>
          <button id="btnNextScene" class="btn-act primary">ฉากถัดไป ▶</button>
        </div>

        <div class="story-filmstrip" id="storyFilmstrip"></div>
      </div>
    </section>

    <!-- TAB 3: SYNTAX INSPECTOR -->
    <section id="tab-syntax" class="tab-content">
      <div class="syntax-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <h2 style="font-size:1.2rem; font-weight:800; color:var(--indigo-dark);">🔍 แยกชิ้นส่วนโครงสร้างประโยค (Syntax Inspector)</h2>
            <p style="font-size:0.9rem; color:var(--muted);">แตะที่แต่ละคำเพื่อฟังเสียงและดูหน้าที่ของคำในประโยค</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="btnPrevSyntax" class="btn-act secondary">◀ ก่อนหน้า</button>
            <button id="btnNextSyntax" class="btn-act primary">ถัดไป ▶</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 180px 1fr; gap:16px; align-items:center;" id="syntaxMainGrid">
          <div style="width:100%; height:150px; background:#f8fafc; border:2px solid var(--border); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            <img id="syntaxImg" style="width:100%; height:100%; object-fit:contain; padding:8px;" src="" alt="ภาพประกอบประโยค" />
          </div>
          <div>
            <div style="font-size:1.15rem; font-weight:800; color:var(--indigo-dark); margin-bottom:4px;" id="syntaxEn"></div>
            <div style="font-size:0.95rem; color:var(--muted); margin-bottom:12px;" id="syntaxTh"></div>
            <div class="syntax-tokens-row" id="syntaxDisplay"></div>
          </div>
        </div>

        <div id="syntaxDesc" style="background:#eef2ff; border-left:4px solid var(--indigo); padding:12px 16px; border-radius:8px; font-size:0.95rem; font-weight:600; color:var(--indigo-dark); min-height:44px; display:flex; align-items:center;">
          แตะคำศัพท์ด้านบนเพื่อดูหน้าที่ทางไวยากรณ์
        </div>

        <div style="display:flex; gap:8px;">
          <button id="btnSpeakSyntax" class="btn-act secondary">🔊 ฟังทั้งประโยค</button>
        </div>
      </div>
    </section>

    <!-- TAB 4: FIXER LAB -->
    <section id="tab-fixer" class="tab-content">
      <div class="fixer-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <h2 style="font-size:1.2rem; font-weight:800; color:#be123c;">🛠️ ห้องซ่อมประโยค (Grammar Fixer Lab)</h2>
            <p style="font-size:0.9rem; color:var(--muted);">ค้นหาจุดที่ผิดทางไวยากรณ์ แล้วเลือกคำที่ถูกต้องที่สุด</p>
          </div>
          <button id="btnNextFixer" class="btn-act primary" style="display:none;">ข้อถัดไป ▶</button>
        </div>

        <div style="display:grid; grid-template-columns: 180px 1fr; gap:16px; align-items:center;" id="fixerMainGrid">
          <div style="width:100%; height:150px; background:#f8fafc; border:2px solid var(--border); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            <img id="fixerImg" style="width:100%; height:100%; object-fit:contain; padding:8px;" src="" alt="ภาพประกอบโจทย์" />
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div class="fixer-wrong-box">
              <div class="fixer-wrong-text" id="fixerWrong">"ประโยคที่มีจุดผิด"</div>
              <div class="fixer-hint" id="fixerHint">คำใบ้</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button id="btnSpeakFixerWrong" class="btn-act secondary">🔊 ฟังประโยคนี้</button>
            </div>
          </div>
        </div>

        <div class="opt-grid" id="fixerOptions"></div>
        <div class="quiz-feedback" id="fixerFeedback"></div>
      </div>
    </section>

    <!-- TAB 5: PRACTICE QUIZ -->
    <section id="tab-quiz" class="tab-content">
      <div class="quiz-card" id="qCard">
        <div class="quiz-meta">
          <div>
            <span style="font-size:1rem; font-weight:800; color:var(--indigo-dark);" id="qCounter">คำถามที่ 1 / 15</span>
          </div>
          <div class="quiz-score-badge">คะแนนสะสม: <span id="qScore">0</span></div>
        </div>

        <div style="display:grid; grid-template-columns: 140px 1fr; gap:16px; align-items:center;" id="quizPromptGrid">
          <div style="width:100%; height:130px; background:#f8fafc; border:2px solid var(--border); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            <img id="qImg" style="width:100%; height:100%; object-fit:contain; padding:8px;" src="" alt="ภาพโจทย์คำถาม" />
          </div>
          <div>
            <h3 style="font-size:1.25rem; font-weight:800; color:var(--navy); line-height:1.4;" id="qPrompt">คำถาม</h3>
            <button id="btnSpeakQ" class="btn-act secondary" style="margin-top:8px;">🔊 ฟังโจทย์</button>
          </div>
        </div>

        <div class="opt-grid" id="qOptions"></div>
        <div class="quiz-feedback" id="qFeedback"></div>

        <div style="display:flex; justify-content:flex-end;">
          <button id="btnNextQ" class="btn-act primary" style="display:none;">ข้อถัดไป ▶</button>
        </div>
      </div>

      <div class="quiz-card" id="qResult" style="display:none; text-align:center; padding:40px 20px;">
        <div style="font-size:3rem; margin-bottom:12px;">🏆</div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--indigo-dark); margin-bottom:8px;">การทดสอบเสร็จสิ้น!</h2>
        <div style="font-size:1.2rem; font-weight:700; color:var(--ok); margin-bottom:20px;" id="qResultScore">คะแนนของคุณ: 15 / 15</div>
        <button id="btnRestartQuiz" class="btn-act primary" style="margin:0 auto;">🔄 ทำแบบทดสอบอีกครั้ง</button>
      </div>
    </section>
  </main>

  <footer>
    <div>โรงเรียนบ้านคำไผ่ · สื่อการสอนไวยากรณ์ภาษาอังกฤษ ป.4–ป.5</div>
    <div class="footer-links">
      <a href="/games/english/grammar-vocab-worksheet.html" target="_blank">พิมพ์ใบงาน A4 สอดคล้อง</a> · 
      <a href="/games/english/">คลังเกมภาษาอังกฤษ</a>
    </div>
  </footer>
</div>

<script>
// DATA INJECTION
/* __INJECT_DATA__ */

// STATE
const state = {
  tab: 'studio',
  modIdx: 0,
  storyIdx: 0,
  sceneIdx: 0,
  storyAutoTimer: null,
  isAutoPlaying: false,
  syntaxIdx: 0,
  fixerIdx: 0,
  qIdx: 0,
  score: 0,
  voiceAccent: 'en-US',
  ttsEnabled: true
};

// STATE INSPECTION HOOK (FOR PLAYWRIGHT TESTING & SYSTEM OBSERVERS)
window.__getState = () => ({
  mode: state.tab,
  tab: state.tab,
  modIdx: state.modIdx,
  storyIdx: state.storyIdx,
  sceneIdx: state.sceneIdx,
  syntaxIdx: state.syntaxIdx,
  fixerIdx: state.fixerIdx,
  qIdx: state.qIdx,
  score: state.score,
  voiceAccent: state.voiceAccent
});

// AUDIO TTS HELPER
function speakText(text, onEnd) {
  if (!state.ttsEnabled) {
    if (onEnd) setTimeout(onEnd, 300);
    return;
  }
  if (!('speechSynthesis' in window)) {
    if (onEnd) setTimeout(onEnd, 300);
    return;
  }
  window.speechSynthesis.cancel();
  // Strip HTML tags
  const clean = text.replace(/<[^>]*>?/gm, '').trim();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = state.voiceAccent;
  u.rate = 0.9;

  const voices = window.speechSynthesis.getVoices();
  const matched = voices.find(v => v.lang === state.voiceAccent || v.lang.startsWith(state.voiceAccent.slice(0, 2)));
  if (matched) u.voice = matched;

  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  window.speechSynthesis.speak(u);
}

// ECHO REPEAT-AFTER-ME
function triggerEcho(text) {
  speakText(text, () => {
    let countdown = 3;
    const desc = document.getElementById('storyAutoStatus');
    if (desc) desc.textContent = '🎤 พูดตาม: ' + countdown + 's';
    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        if (desc) desc.textContent = '🎤 พูดตาม: ' + countdown + 's';
      } else {
        clearInterval(interval);
        if (desc) {
          desc.textContent = '✨ ยอดเยี่ยมมาก!';
          setTimeout(() => desc.textContent = '', 2000);
        }
      }
    }, 1000);
  });
}

// TAB SWITCHING
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

function switchTab(targetTab) {
  state.tab = targetTab;
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === targetTab));
  tabContents.forEach(c => c.classList.toggle('active', c.id === 'tab-' + targetTab));
  if (targetTab !== 'story' && state.isAutoPlaying) {
    stopAutoPlayStory();
  }
}
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// TAB 1: GRAMMAR STUDIO
const moduleNav = document.getElementById('moduleNav');
const formulaContainer = document.getElementById('formulaContainer');
const exampleGrid = document.getElementById('exampleGrid');

function renderModuleNav() {
  moduleNav.innerHTML = '';
  MODULES.forEach((mod, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn-mod' + (idx === state.modIdx ? ' active' : '');
    btn.textContent = mod.name;
    btn.addEventListener('click', () => {
      state.modIdx = idx;
      renderModuleNav();
      renderFormula();
    });
    moduleNav.appendChild(btn);
  });
}

function renderFormula() {
  const mod = MODULES[state.modIdx];
  formulaContainer.innerHTML = '<div class="formula-banner">' +
    '<h2>' + mod.title + '</h2>' +
    '<div class="formula-desc">' + mod.desc + '</div>' +
    '<div class="formula-box">' + mod.rule + '</div>' +
    '</div>';

  exampleGrid.innerHTML = mod.examples.map(ex => {
    const safeEn = ex.en.replace(/'/g, "\\\\'");
    return '<div class="example-card">' +
      '<div class="ex-img-wrapper">' +
        '<span class="ex-badge">' + ex.focus + '</span>' +
        '<img class="ex-img" src="' + ex.img + '" alt="' + ex.focus + '" loading="lazy" />' +
      '</div>' +
      '<div class="ex-body">' +
        '<div>' +
          '<div class="ex-sentence">' + ex.en + '</div>' +
          '<div class="ex-translation">' + ex.th + '</div>' +
        '</div>' +
        '<div class="ex-rule-note">' + ex.ruleNote + '</div>' +
        '<div class="ex-actions">' +
          '<button class="btn-act primary" onclick="speakText(\\'' + safeEn + '\\')">🔊 ฟัง</button>' +
          '<button class="btn-act secondary" onclick="triggerEcho(\\'' + safeEn + '\\')">🎤 ฝึกพูดตาม</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}
renderModuleNav();
renderFormula();

// TAB 2: SEQUENTIAL STORYBOARD
const storyNav = document.getElementById('storyNav');
const storyBadge = document.getElementById('storyBadge');
const storyDots = document.getElementById('storyDots');
const sceneBadge = document.getElementById('sceneBadge');
const sceneImg = document.getElementById('sceneImg');
const sceneTitle = document.getElementById('sceneTitle');
const sceneSentenceEn = document.getElementById('sceneSentenceEn');
const sceneSentenceTh = document.getElementById('sceneSentenceTh');
const sceneRuleCallout = document.getElementById('sceneRuleCallout');
const btnSpeakScene = document.getElementById('btnSpeakScene');
const btnEchoScene = document.getElementById('btnEchoScene');
const btnAutoPlayStory = document.getElementById('btnAutoPlayStory');
const btnPrevScene = document.getElementById('btnPrevScene');
const btnNextScene = document.getElementById('btnNextScene');
const storyFilmstrip = document.getElementById('storyFilmstrip');
const storyAutoStatus = document.getElementById('storyAutoStatus');

function renderStoryNav() {
  storyNav.innerHTML = '';
  STORIES.forEach((story, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn-story' + (idx === state.storyIdx ? ' active' : '');
    btn.textContent = story.title;
    btn.addEventListener('click', () => {
      state.storyIdx = idx;
      state.sceneIdx = 0;
      stopAutoPlayStory();
      renderStoryNav();
      renderScene();
    });
    storyNav.appendChild(btn);
  });
}

function renderScene() {
  const story = STORIES[state.storyIdx];
  const scene = story.scenes[state.sceneIdx];

  storyBadge.textContent = 'ฉากที่ ' + (state.sceneIdx + 1) + ' / ' + story.scenes.length;
  sceneBadge.textContent = scene.badge;
  sceneImg.src = scene.img;
  sceneTitle.textContent = scene.title;
  sceneSentenceEn.innerHTML = scene.en;
  sceneSentenceTh.textContent = scene.th;
  sceneRuleCallout.textContent = '💡 กฎไวยากรณ์: ' + scene.rule;

  // Render Dots
  storyDots.innerHTML = '';
  story.scenes.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = 'step-dot' + (idx === state.sceneIdx ? ' active' : '');
    dot.addEventListener('click', () => {
      state.sceneIdx = idx;
      renderScene();
    });
    storyDots.appendChild(dot);
  });

  // Render Filmstrip
  storyFilmstrip.innerHTML = '';
  story.scenes.forEach((sc, idx) => {
    const card = document.createElement('div');
    card.className = 'film-card' + (idx === state.sceneIdx ? ' active' : '');
    card.innerHTML = '<img class="film-thumb" src="' + sc.img + '" alt="ฉาก ' + (idx + 1) + '" />' +
      '<div class="film-label">ฉาก ' + (idx + 1) + '</div>';
    card.addEventListener('click', () => {
      state.sceneIdx = idx;
      renderScene();
    });
    storyFilmstrip.appendChild(card);
  });
}

btnSpeakScene.addEventListener('click', () => {
  const cur = STORIES[state.storyIdx].scenes[state.sceneIdx];
  speakText(cur.en);
});

btnEchoScene.addEventListener('click', () => {
  const cur = STORIES[state.storyIdx].scenes[state.sceneIdx];
  triggerEcho(cur.en);
});

btnPrevScene.addEventListener('click', () => {
  const story = STORIES[state.storyIdx];
  state.sceneIdx = (state.sceneIdx - 1 + story.scenes.length) % story.scenes.length;
  renderScene();
});

btnNextScene.addEventListener('click', () => {
  const story = STORIES[state.storyIdx];
  state.sceneIdx = (state.sceneIdx + 1) % story.scenes.length;
  renderScene();
});

function stopAutoPlayStory() {
  state.isAutoPlaying = false;
  if (state.storyAutoTimer) clearTimeout(state.storyAutoTimer);
  btnAutoPlayStory.textContent = '⏯ เล่นนิทานต่อเนื่อง';
  storyAutoStatus.textContent = '';
}

function playNextAutoScene() {
  if (!state.isAutoPlaying) return;
  const story = STORIES[state.storyIdx];
  renderScene();
  const cur = story.scenes[state.sceneIdx];
  storyAutoStatus.textContent = 'กำลังเล่นฉาก ' + (state.sceneIdx + 1) + ' / ' + story.scenes.length;

  speakText(cur.en, () => {
    if (!state.isAutoPlaying) return;
    state.storyAutoTimer = setTimeout(() => {
      if (state.sceneIdx < story.scenes.length - 1) {
        state.sceneIdx++;
        playNextAutoScene();
      } else {
        storyAutoStatus.textContent = '🎉 จบนิทานเรื่องนี้แล้ว';
        stopAutoPlayStory();
      }
    }, 2500);
  });
}

btnAutoPlayStory.addEventListener('click', () => {
  if (state.isAutoPlaying) {
    stopAutoPlayStory();
  } else {
    state.isAutoPlaying = true;
    btnAutoPlayStory.textContent = '⏹ หยุดเล่นนิทาน';
    state.sceneIdx = 0;
    playNextAutoScene();
  }
});

renderStoryNav();
renderScene();

// TAB 3: SYNTAX INSPECTOR
const syntaxImg = document.getElementById('syntaxImg');
const syntaxEn = document.getElementById('syntaxEn');
const syntaxTh = document.getElementById('syntaxTh');
const syntaxDisplay = document.getElementById('syntaxDisplay');
const syntaxDesc = document.getElementById('syntaxDesc');
const btnPrevSyntax = document.getElementById('btnPrevSyntax');
const btnNextSyntax = document.getElementById('btnNextSyntax');
const btnSpeakSyntax = document.getElementById('btnSpeakSyntax');

function renderSyntax() {
  const cur = SYNTAX_DATA[state.syntaxIdx];
  syntaxImg.src = cur.img;
  syntaxEn.textContent = cur.full;
  syntaxTh.textContent = cur.th;
  syntaxDisplay.innerHTML = '';
  syntaxDesc.textContent = 'แตะที่แต่ละคำเพื่อดูหน้าที่ของคำในประโยค';

  cur.tokens.forEach(tok => {
    const el = document.createElement('div');
    el.className = 'syntax-token ' + tok.type;
    el.innerHTML = '<span>' + tok.word + '</span><span class="token-label">' + tok.label + '</span>';
    el.addEventListener('click', () => {
      speakText(tok.word);
      syntaxDesc.textContent = '📌 คำว่า "' + tok.word + '" ทำหน้าที่เป็น ' + tok.label + ' (' + tok.desc + ')';
    });
    syntaxDisplay.appendChild(el);
  });
}

btnPrevSyntax.addEventListener('click', () => {
  state.syntaxIdx = (state.syntaxIdx - 1 + SYNTAX_DATA.length) % SYNTAX_DATA.length;
  renderSyntax();
});
btnNextSyntax.addEventListener('click', () => {
  state.syntaxIdx = (state.syntaxIdx + 1) % SYNTAX_DATA.length;
  renderSyntax();
});
btnSpeakSyntax.addEventListener('click', () => speakText(SYNTAX_DATA[state.syntaxIdx].full));
renderSyntax();

// TAB 4: FIXER LAB
const fixerImg = document.getElementById('fixerImg');
const fixerWrong = document.getElementById('fixerWrong');
const fixerHint = document.getElementById('fixerHint');
const fixerOptions = document.getElementById('fixerOptions');
const fixerFeedback = document.getElementById('fixerFeedback');
const btnNextFixer = document.getElementById('btnNextFixer');
const btnSpeakFixerWrong = document.getElementById('btnSpeakFixerWrong');

function renderFixer() {
  const cur = FIXER_DATA[state.fixerIdx];
  fixerImg.src = cur.img;
  fixerWrong.textContent = '"' + cur.wrong + '"';
  fixerHint.textContent = '💡 คำใบ้: ' + cur.hint;
  fixerFeedback.className = 'quiz-feedback';
  btnNextFixer.style.display = 'none';
  fixerOptions.innerHTML = '';

  cur.opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = '<strong>' + opt + '</strong>';
    btn.addEventListener('click', () => {
      const all = fixerOptions.querySelectorAll('.opt-btn');
      if (opt === cur.ans) {
        btn.classList.add('correct');
        fixerFeedback.className = 'quiz-feedback show correct';
        fixerFeedback.textContent = '✅ ถูกต้อง! ' + cur.exp;
        speakText(cur.right);
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
      } else {
        btn.classList.add('wrong');
        fixerFeedback.className = 'quiz-feedback show wrong';
        fixerFeedback.textContent = '❌ ยังไม่ถูกต้อง (' + cur.exp + ')';
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.wrong();
      }
      btnNextFixer.style.display = 'inline-flex';
    });
    fixerOptions.appendChild(btn);
  });
}

btnNextFixer.addEventListener('click', () => {
  state.fixerIdx = (state.fixerIdx + 1) % FIXER_DATA.length;
  renderFixer();
});
btnSpeakFixerWrong.addEventListener('click', () => speakText(FIXER_DATA[state.fixerIdx].wrong));
renderFixer();

// TAB 5: PRACTICE QUIZ
const qCard = document.getElementById('qCard');
const qResult = document.getElementById('qResult');
const qCounter = document.getElementById('qCounter');
const qScore = document.getElementById('qScore');
const qImg = document.getElementById('qImg');
const qPrompt = document.getElementById('qPrompt');
const qOptions = document.getElementById('qOptions');
const qFeedback = document.getElementById('qFeedback');
const btnSpeakQ = document.getElementById('btnSpeakQ');
const btnNextQ = document.getElementById('btnNextQ');
const qResultScore = document.getElementById('qResultScore');
const btnRestartQuiz = document.getElementById('btnRestartQuiz');

function renderQuiz() {
  const q = QUIZ_QUESTIONS[state.qIdx];
  qCounter.textContent = 'คำถามที่ ' + (state.qIdx + 1) + ' / ' + QUIZ_QUESTIONS.length;
  qPrompt.textContent = q.q;
  qImg.src = q.img;
  qFeedback.className = 'quiz-feedback';
  btnNextQ.style.display = 'none';
  qOptions.innerHTML = '';

  q.opts.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      const all = qOptions.querySelectorAll('.opt-btn');
      all.forEach(b => b.disabled = true);
      if (idx === q.a) {
        btn.classList.add('correct');
        state.score++;
        qFeedback.className = 'quiz-feedback show correct';
        qFeedback.textContent = '✅ ถูกต้อง! ' + q.exp;
        speakText(q.q.replace(/_{3,}/g, opt));
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
      } else {
        btn.classList.add('wrong');
        all[q.a].classList.add('correct');
        qFeedback.className = 'quiz-feedback show wrong';
        qFeedback.textContent = '❌ ยังไม่ถูกต้อง (' + q.exp + ')';
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.wrong();
      }
      qScore.textContent = state.score;
      btnNextQ.style.display = 'inline-flex';
    });
    qOptions.appendChild(btn);
  });
}

btnNextQ.addEventListener('click', () => {
  if (state.qIdx < QUIZ_QUESTIONS.length - 1) {
    state.qIdx++;
    renderQuiz();
  } else {
    qCard.style.display = 'none';
    qResult.style.display = 'block';
    qResultScore.textContent = 'คะแนนของคุณ: ' + state.score + ' / ' + QUIZ_QUESTIONS.length + ' คะแนน';
  }
});

btnSpeakQ.addEventListener('click', () => speakText(QUIZ_QUESTIONS[state.qIdx].q));

btnRestartQuiz.addEventListener('click', () => {
  state.qIdx = 0;
  state.score = 0;
  qScore.textContent = 0;
  qCard.style.display = 'flex';
  qResult.style.display = 'none';
  renderQuiz();
});
renderQuiz();

// CONTROLS & SHORTCUTS
document.getElementById('selVoiceAccent').addEventListener('change', (e) => state.voiceAccent = e.target.value);
document.getElementById('btnAudioToggle').addEventListener('click', () => {
  state.ttsEnabled = !state.ttsEnabled;
  document.getElementById('audioIcon').textContent = state.ttsEnabled ? '🔊' : '🔇';
  document.getElementById('audioLabel').textContent = state.ttsEnabled ? 'เปิดเสียง' : 'ปิดเสียง';
});
document.getElementById('btnFullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
});

// SMARTBOARD SHORTCUTS
window.addEventListener('keydown', (e) => {
  if (e.key === '1') switchTab('studio');
  if (e.key === '2') switchTab('story');
  if (e.key === '3') switchTab('syntax');
  if (e.key === '4') switchTab('fixer');
  if (e.key === '5') switchTab('quiz');
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (state.tab === 'studio') {
      const mod = MODULES[state.modIdx];
      speakText(mod.examples[0].en);
    } else if (state.tab === 'story') {
      btnSpeakScene.click();
    } else if (state.tab === 'syntax') {
      btnSpeakSyntax.click();
    } else if (state.tab === 'quiz') {
      btnSpeakQ.click();
    }
  }
  if (e.key === 'ArrowRight') {
    if (state.tab === 'story') btnNextScene.click();
    else if (state.tab === 'syntax') btnNextSyntax.click();
    else if (state.tab === 'fixer' && btnNextFixer.style.display !== 'none') btnNextFixer.click();
    else if (state.tab === 'quiz' && btnNextQ.style.display !== 'none') btnNextQ.click();
  }
  if (e.key === 'ArrowLeft') {
    if (state.tab === 'story') btnPrevScene.click();
    else if (state.tab === 'syntax') btnPrevSyntax.click();
  }
  if (e.key === 'f' || e.key === 'F') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }
});
</script>
</body>
</html>
`;

const dataScript = `
const MODULES = ${JSON.stringify(MODULES, null, 2)};
const STORIES = ${JSON.stringify(STORIES, null, 2)};
const SYNTAX_DATA = ${JSON.stringify(SYNTAX_DATA, null, 2)};
const FIXER_DATA = ${JSON.stringify(FIXER_DATA, null, 2)};
const QUIZ_QUESTIONS = ${JSON.stringify(QUIZ_QUESTIONS, null, 2)};
`;

const finalHtml = htmlTemplate.replace('/* __INJECT_DATA__ */', dataScript);
fs.writeFileSync(path.resolve('public/games/english/grammar-vocab-media.html'), finalHtml, 'utf-8');
console.log('Successfully written public/games/english/grammar-vocab-media.html');
