import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * Normalizes a Thai word:
 * - Trims whitespace and zero-width spaces (\u200B, \uFEFF)
 * - Strips leading digits (both Arabic and Thai digits like 1., 12., ๑., ๑,๐๔๙)
 * - Cleans internal broken whitespace for known split loanwords (e.g. "สึ นามิ" -> "สึนามิ")
 * - Applies Unicode NFC normalization
 */
export function normalizeThaiWord(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let word = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  // Strip leading numbering e.g. "1.", "100.", "๑.", "๑,๐๔๙"
  word = word.replace(/^[0-9๑๒๓๔๕๖๗๘๙๐,]+[\.\s]*/, '').trim();

  // Fix common split words with space in middle
  const splitFixes = {
    'สึ นามิ': 'สึนามิ',
    'แบนด์ วิดท์': 'แบนด์วิดท์',
    'ซอฟต์ แวร์': 'ซอฟต์แวร์',
    'ฮาร์ด แวร์': 'ฮาร์ดแวร์',
    'ชิป ประมวลผล': 'ชิปประมวลผล',
    'บาร์ โค้ด': 'บาร์โค้ด',
    'แพลต ฟอร์ม': 'แพลตฟอร์ม',
    'เว็บไซต์ การเรียนรู้': 'เว็บไซต์การเรียนรู้',
    'กบในกะลำครอบ': 'กบในกะลาครอบ',
    'กิ้งกำไดท้อง': 'กิ้งก่าได้ทอง',
    'กำ ดดั': 'กำจัด',
    'กำ นลั': 'กำนัล',
    'จำ้ละหวนั่': 'จ้าละหวั่น',
    'ฌำณ': 'ฌาน',
    'อภิปาย': 'อภิปราย',
    'สปาเก็ตตี้': 'สปาเกตตี',
    'ปลำยปล้ืม': 'ปลาบปลื้ม',
    'ตกั๊แตน': 'ตั๊กแตน'
  };

  if (splitFixes[word]) {
    word = splitFixes[word];
  }

  // NFC normalization
  return word.normalize('NFC').trim();
}

/**
 * Extracts all raw words from the 4 primary source files:
 * 1. Doc 1 (fae20491.docx) - 1,000 words
 * 2. Doc 2 (86b9b2fe.docx) - 1,000 words
 * 3. Doc 3 (b5e26ef6.docx) - 1,000 words
 * 4. Doc 4 (PDF 11-page OCR: pdf-words.json) - 1,048 words
 */
export function extractAllRawWords() {
  const allWords = [];

  // Helper to read docx XML
  const readDocxXml = (folderName) => {
    const fullPath = path.join(ROOT, 'scratch', folderName, 'word/document.xml');
    if (!fs.existsSync(fullPath)) return '';
    return fs.readFileSync(fullPath, 'utf8');
  };

  // 1. Doc 1
  const doc1Xml = readDocxXml('media_1794403932892_fae20491');
  if (doc1Xml) {
    const pMatches = doc1Xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    let idx = 0;
    for (const p of pMatches) {
      const texts = (p.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || []).map(m => m.replace(/<[^>]+>/g, '')).join('').trim();
      if (texts) {
        for (const t of texts.split(/\s+/).filter(Boolean)) {
          const norm = normalizeThaiWord(t);
          if (norm) {
            allWords.push({ source: 'doc1_vocab_list', word: norm, rawIndex: ++idx });
          }
        }
      }
    }
  }

  // 2. Doc 2
  const doc2Xml = readDocxXml('media_1794403932892_86b9b2fe');
  if (doc2Xml) {
    const pMatches = doc2Xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    let idx = 0;
    for (const p of pMatches) {
      const texts = (p.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || []).map(m => m.replace(/<[^>]+>/g, '')).join('').trim();
      if (texts) {
        const norm = normalizeThaiWord(texts);
        if (norm) {
          allWords.push({ source: 'doc2_daily_social', word: norm, rawIndex: ++idx });
        }
      }
    }
  }

  // 3. Doc 3
  const doc3Xml = readDocxXml('media_1794403932892_b5e26ef6');
  if (doc3Xml) {
    const pMatches = doc3Xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    let idx = 0;
    for (const p of pMatches) {
      const texts = (p.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || []).map(m => m.replace(/<[^>]+>/g, '')).join('').trim();
      if (texts) {
        const norm = normalizeThaiWord(texts);
        if (norm) {
          allWords.push({ source: 'doc3_science_nature', word: norm, rawIndex: ++idx });
        }
      }
    }
  }

  // 4. PDF words
  const pdfJsonPath = path.join(__dirname, 'data/pdf-words.json');
  if (fs.existsSync(pdfJsonPath)) {
    const pdfItems = JSON.parse(fs.readFileSync(pdfJsonPath, 'utf8'));
    for (const item of pdfItems) {
      const norm = normalizeThaiWord(item.word);
      if (norm) {
        allWords.push({ source: 'pdf_basic_grade4', word: norm, rawIndex: Number(item.num) || 0 });
      }
    }
  }

  return allWords;
}
