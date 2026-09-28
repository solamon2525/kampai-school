/**
 * omr-scanner.service.ts
 * บริการประมวลผลกระดาษคำตอบ OMR ด้วยกล้องมือถือและ AI Vision
 * รองรับการเปิดกล้องหลังมือถือ, ถ่ายภาพ, และส่งวิเคราะห์ด้วย Gemini / Claude Vision
 */

export interface OMRAnalysisResult {
  answers: (number | null)[];
  detectedStudentNo?: number | null;
  detectedClass?: string | null;
  rawResponse?: string;
}

export interface QuestionGradingDetail {
  index: number;
  questionText: string;
  studentAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface OMRGradingSummary {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  percentage: number;
  passed: boolean;
  details: QuestionGradingDetail[];
}

export interface QuestionToGrade {
  answer?: number | string | boolean | unknown;
  question_text?: string;
  question?: string;
}

interface AIOMRResponse {
  answers?: (number | null)[];
  detected_student_no?: number | null;
  detected_class?: string | null;
}

export const OMR_LETTER_LABELS = ['ก', 'ข', 'ค', 'ง'] as const;

export const omrScannerService = {
  /**
   * ขออนุญาตเข้าถึงกล้องหลังของมือถือ
   */
  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง');
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  },

  /**
   * ปิดการใช้งานกล้อง
   */
  stopCamera(stream: MediaStream | null, videoElement?: HTMLVideoElement | null) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  },

  /**
   * บันทึกภาพนิ่งจาก video element เป็น base64 JPEG
   */
  captureFrame(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ไม่สามารถสร้าง canvas context สำหรับจับภาพได้');

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  },

  /**
   * แปลง File จาก input image เป็น base64 string
   */
  async readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  /**
   * วิเคราะห์ภาพกระดาษคำตอบด้วย AI Vision (Gemini API)
   */
  async analyzeWithAI(
    base64DataUrl: string,
    numQuestions: number,
    geminiApiKey?: string
  ): Promise<OMRAnalysisResult> {
    // API key จาก param หรือ env
    const apiKey =
      geminiApiKey ||
      import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('ไม่พบ Gemini API Key กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env');
    }

    const base64Data = base64DataUrl.includes(',')
      ? base64DataUrl.split(',')[1]
      : base64DataUrl;
    const mimeType = base64DataUrl.startsWith('data:image/png')
      ? 'image/png'
      : 'image/jpeg';

    const prompt = `นี่คือภาพถ่ายกระดาษคำตอบข้อสอบ OMR ของนักเรียน
มีข้อสอบทั้งหมด ${numQuestions} ข้อ (ข้อ 1 ถึงข้อ ${numQuestions})
แต่ละข้อจะมี 4 ตัวเลือก: ก, ข, ค, ง (หรือ 1, 2, 3, 4)

โปรดวิเคราะห์รอยฝนด้วยดินสอหรือปากกา:
1. "detected_student_no": เลขที่นักเรียน (1-50) โดยสังเกตจากบล็อกฝนรหัสเลขที่ 2 หลัก (หลักสิบ 0-4 และ หลักหน่วย 0-9) หรือจากช่องเขียนเลขที่
2. "detected_class": ระดับชั้นเรียนที่ระบุ (เช่น "ป.4")
3. "answers": อาเรย์คำตอบแต่ละข้อ:
   - 0 = ก
   - 1 = ข
   - 2 = ค
   - 3 = ง
   - null = ไม่ได้ฝน, ฝนจางมากจนอ่านไม่ออก, หรือฝนซ้ำมากกว่า 1 ตัวเลือก

โปรดตอบเป็น JSON ล้วนๆ ในรูปแบบนี้เท่านั้น:
{
  "answers": [0, 1, 2, 3, null, ...],
  "detected_student_no": 5,
  "detected_class": "ป.4"
}

กฎบังคับ:
1. อาเรย์ answers ต้องมีความยาวครบ ${numQuestions} รายการพอดี
2. ห้ามใส่เครื่องหมาย markdown block เช่น \`\`\`json ให้ส่งเฉพาะ JSON string`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errText = `HTTP Error ${res.status}`;
      try {
        const errJson = await res.json();
        errText = errJson.error?.message || errText;
      } catch (e) {
        void e;
      }
      throw new Error(`AI Vision Error: ${errText}`);
    }

    const json = await res.json();
    const candidateText =
      json.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: AIOMRResponse;
    try {
      const clean = candidateText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start >= 0 && end > start) {
        parsed = JSON.parse(clean.substring(start, end + 1));
      } else {
        parsed = JSON.parse(clean);
      }
    } catch {
      throw new Error('ไม่สามารถแปลงผลลัพธ์จาก AI เป็น JSON ได้ กรุณาลองใหม่อีกครั้ง');
    }

    if (!parsed || !Array.isArray(parsed.answers)) {
      throw new Error('โครงสร้างคำตอบจาก AI ไม่ถูกต้อง');
    }

    // ปรับขนาด answers ให้ครบ numQuestions
    const answers: (number | null)[] = [...parsed.answers];
    while (answers.length < numQuestions) answers.push(null);
    const finalAnswers = answers.slice(0, numQuestions);

    return {
      answers: finalAnswers,
      detectedStudentNo: parsed.detected_student_no ?? null,
      detectedClass: parsed.detected_class ?? null,
      rawResponse: candidateText,
    };
  },

  /**
   * คำนวณคะแนนและเปรียบเทียบกับเฉลย
   */
  gradeAnswers(
    studentAnswers: (number | null)[],
    questions: QuestionToGrade[],
    passThresholdPct = 50
  ): OMRGradingSummary {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const details: QuestionGradingDetail[] = questions.map((q, idx) => {
      const studentAns = studentAnswers[idx] ?? null;
      const rawAns = q.answer;
      const correctAns =
        typeof rawAns === 'number'
          ? rawAns
          : typeof rawAns === 'string'
          ? parseInt(rawAns, 10) || 0
          : 0;

      if (studentAns === null || studentAns === undefined) {
        unansweredCount++;
        return {
          index: idx,
          questionText: q.question_text || q.question || `ข้อที่ ${idx + 1}`,
          studentAnswer: null,
          correctAnswer: correctAns,
          isCorrect: false,
        };
      }

      const isCorrect = studentAns === correctAns;
      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        index: idx,
        questionText: q.question_text || q.question || `ข้อที่ ${idx + 1}`,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect,
      };
    });

    const totalQuestions = questions.length || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= passThresholdPct;

    return {
      totalQuestions: questions.length,
      correctCount,
      wrongCount,
      unansweredCount,
      percentage,
      passed,
      details,
    };
  },
};
