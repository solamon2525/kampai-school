import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';

const brainDir = 'C:/Users/Administrator/.gemini/antigravity/brain/0293d727-39dd-45ab-b9dd-7f38972aa295';
const outDir = 'D:/kampai-school-main/public/games/english/tpr-actions';
fs.mkdirSync(outDir, { recursive: true });

// 14 Base Generated Images
const baseMap = {
  'stand-up': 'tpr_stand_up_1789999324127.jpg',
  'sit-down': 'tpr_sit_down_1789999348460.jpg',
  'walk': 'tpr_walk_1789999544280.jpg',
  'jump': 'tpr_jump_1789999680651.jpg',
  'squat-down': 'tpr_squat_down_1789999830665.jpg',
  'kneel-down': 'tpr_kneel_down_1789999846039.jpg',
  'run-fast': 'tpr_run_fast_1789999860057.jpg',
  'turn-left': 'tpr_turn_left_1789999882308.jpg',
  'turn-right': 'tpr_turn_right_1789999900933.jpg',
  'turn-around': 'tpr_turn_around_1789999915723.jpg',
  'put-it-up': 'tpr_put_it_up_1789999939331.jpg',
  'put-it-down': 'tpr_put_it_down_1789999952950.jpg',
  'step-forward': 'tpr_step_forward_1789999967226.jpg',
  'open-mouth': 'tpr_open_mouth_1789999989500.jpg',
};

async function processBaseImages() {
  console.log('--- Processing 14 Base Generated Images ---');
  for (const [id, filename] of Object.entries(baseMap)) {
    const srcPath = path.join(brainDir, filename);
    const destPath = path.join(outDir, `${id}.webp`);
    if (fs.existsSync(srcPath)) {
      await sharp(srcPath)
        .resize(512, 512, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(destPath);
      console.log(`✓ Saved ${id}.webp`);
    } else {
      console.error(`✗ Missing ${srcPath}`);
    }
  }
}

async function renderSynthesizedActions() {
  console.log('--- Synthesizing Remaining 12 Actions via Playwright Canvas ---');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });

  // Read base images as base64 for embedding into browser
  const getB64 = (filename) => {
    const p = path.join(brainDir, filename);
    return 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64');
  };

  const imgStandUp = getB64(baseMap['stand-up']);
  const imgJump = getB64(baseMap['jump']);
  const imgPutUp = getB64(baseMap['put-it-up']);
  const imgOpenMouth = getB64(baseMap['open-mouth']);

  const synthTasks = [
    {
      id: 'close-left-eye',
      base: imgOpenMouth,
      render: `
        // Student winks his left eye (viewer's right side)
        // Draw base face
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);
        
        // Viewer's right eye is at x=645, y=525, r=65
        // Cover viewer's right eye with skin patch matching cheek/face tone
        const skinGrad = ctx.createRadialGradient(645, 520, 10, 645, 520, 80);
        skinGrad.addColorStop(0, '#fde6d8');
        skinGrad.addColorStop(0.7, '#fcd7c4');
        skinGrad.addColorStop(1, '#fbc8b0');
        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.arc(645, 520, 75, 0, Math.PI * 2);
        ctx.fill();

        // Draw cute winking crescent line for left eye
        ctx.strokeStyle = '#2d1b14';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Arching winking eye curve ⌒
        ctx.arc(645, 535, 50, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        // Eyelash ticks
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(685, 510);
        ctx.lineTo(705, 495);
        ctx.moveTo(690, 525);
        ctx.lineTo(715, 520);
        ctx.stroke();

        // Cute blush under wink
        ctx.fillStyle = 'rgba(255, 100, 120, 0.4)';
        ctx.beginPath();
        ctx.ellipse(645, 600, 45, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little sparkle near wink
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(710, 470, 8, 0, Math.PI * 2);
        ctx.fill();
      `
    },
    {
      id: 'close-right-eye',
      base: imgOpenMouth,
      render: `
        // Student winks his right eye (viewer's left side)
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);
        
        // Viewer's left eye is at x=365, y=525, r=65
        const skinGrad = ctx.createRadialGradient(365, 520, 10, 365, 520, 80);
        skinGrad.addColorStop(0, '#fde6d8');
        skinGrad.addColorStop(0.7, '#fcd7c4');
        skinGrad.addColorStop(1, '#fbc8b0');
        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.arc(365, 520, 75, 0, Math.PI * 2);
        ctx.fill();

        // Cute winking crescent line for right eye
        ctx.strokeStyle = '#2d1b14';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(365, 535, 50, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        // Eyelash ticks
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(325, 510);
        ctx.lineTo(305, 495);
        ctx.moveTo(320, 525);
        ctx.lineTo(295, 520);
        ctx.stroke();

        // Cute blush
        ctx.fillStyle = 'rgba(255, 100, 120, 0.4)';
        ctx.beginPath();
        ctx.ellipse(365, 600, 45, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little sparkle
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(300, 470, 8, 0, Math.PI * 2);
        ctx.fill();
      `
    },
    {
      id: 'raise-hands',
      base: imgJump,
      render: `
        // Student standing firmly with both hands raised high up!
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);
        
        // Ground plane under student
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 880, 1024, 144);

        // Draw shadow on ground
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.ellipse(512, 940, 220, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw legs standing firmly down
        // Left shoe
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(420, 880, 70, 45, 18);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(420, 915, 70, 10);

        // Right shoe
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(534, 880, 70, 45, 18);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(534, 915, 70, 10);

        // White socks
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(435, 820, 40, 65);
        ctx.fillRect(549, 820, 40, 65);

        // Motion / energy lines around hands
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        // Left hand sparkles
        ctx.beginPath();
        ctx.moveTo(220, 200); ctx.lineTo(190, 170);
        ctx.moveTo(250, 180); ctx.lineTo(240, 140);
        ctx.moveTo(280, 190); ctx.lineTo(300, 150);
        // Right hand sparkles
        ctx.moveTo(800, 200); ctx.lineTo(830, 170);
        ctx.moveTo(770, 180); ctx.lineTo(780, 140);
        ctx.moveTo(740, 190); ctx.lineTo(720, 150);
        ctx.stroke();
      `
    },
    {
      id: 'touch-head',
      base: imgStandUp,
      render: `
        // Student touching both hands on top of head
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Clean out original hanging arms
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(280, 560, 110, 180);
        ctx.fillRect(630, 560, 110, 180);

        // Draw arms raised to touch head 🙆
        ctx.strokeStyle = '#2d1b14';
        ctx.fillStyle = '#fde6d8';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';

        // Left arm going up to head
        ctx.beginPath();
        ctx.moveTo(380, 440);
        ctx.quadraticCurveTo(280, 320, 380, 150);
        ctx.quadraticCurveTo(430, 110, 460, 130);
        ctx.quadraticCurveTo(390, 200, 415, 450);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right arm going up to head
        ctx.beginPath();
        ctx.moveTo(640, 440);
        ctx.quadraticCurveTo(740, 320, 640, 150);
        ctx.quadraticCurveTo(590, 110, 560, 130);
        ctx.quadraticCurveTo(630, 200, 605, 450);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Uniform short sleeves on arms
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(360, 410, 55, 60, 10);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(605, 410, 55, 60, 10);
        ctx.fill();
        ctx.stroke();

        // Hands resting on head
        ctx.fillStyle = '#fde6d8';
        ctx.beginPath();
        ctx.ellipse(450, 135, 35, 25, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(570, 135, 35, 25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sparkle of achievement
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(512, 80, 10, 0, Math.PI * 2);
        ctx.fill();
      `
    },
    {
      id: 'clap-hands',
      base: imgStandUp,
      render: `
        // Student clapping hands together in front of chest
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Clear hanging arms
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(280, 560, 110, 180);
        ctx.fillRect(630, 560, 110, 180);

        // Draw arms bent towards center chest
        ctx.strokeStyle = '#2d1b14';
        ctx.fillStyle = '#fde6d8';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';

        // Left forearm
        ctx.beginPath();
        ctx.moveTo(380, 480);
        ctx.quadraticCurveTo(360, 580, 480, 550);
        ctx.lineTo(470, 500);
        ctx.quadraticCurveTo(390, 500, 390, 460);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right forearm
        ctx.beginPath();
        ctx.moveTo(640, 480);
        ctx.quadraticCurveTo(660, 580, 540, 550);
        ctx.lineTo(550, 500);
        ctx.quadraticCurveTo(630, 500, 630, 460);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Clapping hands meeting in middle
        ctx.fillStyle = '#fde6d8';
        ctx.beginPath();
        ctx.ellipse(500, 530, 30, 22, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(524, 530, 30, 22, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Clapping sound & impact stars 👏 ✨
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        const drawStar = (cx, cy, r) => {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(cx + Math.cos((18 + i * 72) * Math.PI / 180) * r, cy - Math.sin((18 + i * 72) * Math.PI / 180) * r);
            ctx.lineTo(cx + Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2), cy - Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2));
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        };
        drawStar(512, 480, 18);
        drawStar(470, 470, 10);
        drawStar(554, 470, 10);

        // Impact lines
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(440, 530); ctx.lineTo(410, 530);
        ctx.moveTo(580, 530); ctx.lineTo(610, 530);
        ctx.stroke();
      `
    },
    {
      id: 'touch-ears',
      base: imgStandUp,
      render: `
        // Student touching both ears
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Clear hanging arms
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(280, 560, 110, 180);
        ctx.fillRect(630, 560, 110, 180);

        // Draw arms raised to touch ears
        ctx.strokeStyle = '#2d1b14';
        ctx.fillStyle = '#fde6d8';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';

        // Left arm to left ear (x=330, y=310)
        ctx.beginPath();
        ctx.moveTo(380, 480);
        ctx.quadraticCurveTo(280, 430, 320, 310);
        ctx.lineTo(360, 320);
        ctx.quadraticCurveTo(350, 430, 410, 480);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right arm to right ear (x=690, y=310)
        ctx.beginPath();
        ctx.moveTo(640, 480);
        ctx.quadraticCurveTo(740, 430, 700, 310);
        ctx.lineTo(660, 320);
        ctx.quadraticCurveTo(670, 430, 610, 480);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hands touching ears
        ctx.fillStyle = '#fde6d8';
        ctx.beginPath();
        ctx.ellipse(330, 310, 26, 20, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(690, 310, 26, 20, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      `
    },
    {
      id: 'laugh',
      base: imgOpenMouth,
      render: `
        // Student laughing happily, eyes closed into happy curves ^ ^, tears of joy
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Cover eyes with skin patches
        const skinGradL = ctx.createRadialGradient(365, 520, 10, 365, 520, 80);
        skinGradL.addColorStop(0, '#fde6d8'); skinGradL.addColorStop(1, '#fbc8b0');
        ctx.fillStyle = skinGradL;
        ctx.beginPath(); ctx.arc(365, 520, 75, 0, Math.PI * 2); ctx.fill();

        const skinGradR = ctx.createRadialGradient(645, 520, 10, 645, 520, 80);
        skinGradR.addColorStop(0, '#fde6d8'); skinGradR.addColorStop(1, '#fbc8b0');
        ctx.fillStyle = skinGradR;
        ctx.beginPath(); ctx.arc(645, 520, 75, 0, Math.PI * 2); ctx.fill();

        // Draw happy curved laughing eyes ^ ^
        ctx.strokeStyle = '#2d1b14';
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        // Left eye
        ctx.beginPath();
        ctx.arc(365, 535, 50, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();
        // Right eye
        ctx.beginPath();
        ctx.arc(645, 535, 50, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        // Extra rosy cheeks
        ctx.fillStyle = 'rgba(244, 63, 94, 0.55)';
        ctx.beginPath(); ctx.ellipse(330, 610, 50, 30, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(680, 610, 50, 30, 0, 0, Math.PI * 2); ctx.fill();

        // Music notes / laughter sparkles around head
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 50px sans-serif';
        ctx.fillText('♪', 210, 350);
        ctx.fillText('♫', 780, 380);
        ctx.fillText('✨', 800, 480);
      `
    },
    {
      id: 'cry',
      base: imgOpenMouth,
      render: `
        // Student crying with tears streaming down and sad mouth
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Draw sad/crying eyebrows angled down at sides
        ctx.strokeStyle = '#2d1b14';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(310, 380); ctx.quadraticCurveTo(360, 420, 420, 400);
        ctx.moveTo(710, 380); ctx.quadraticCurveTo(660, 420, 600, 400);
        ctx.stroke();

        // Big shiny anime tear drops from eyes
        const drawTear = (x, y, r) => {
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y - r * 1.5);
          ctx.quadraticCurveTo(x + r, y, x + r, y + r);
          ctx.arc(x, y + r, r, 0, Math.PI, false);
          ctx.quadraticCurveTo(x - r, y, x, y - r * 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Tear highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x - r * 0.3, y + r * 0.7, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
        };

        drawTear(330, 590, 22);
        drawTear(320, 660, 16);
        drawTear(690, 590, 22);
        drawTear(700, 660, 16);

        // Tear puddle / streams
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(330, 560); ctx.lineTo(330, 720);
        ctx.moveTo(690, 560); ctx.lineTo(690, 720);
        ctx.stroke();
      `
    },
    {
      id: 'shout-hooray',
      base: imgJump,
      render: `
        // Student jumping and shouting "Hooray!" with joy!
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Speech bubble: Hooray!
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect(580, 60, 380, 110, 35);
        ctx.fill();
        ctx.stroke();

        // Speech bubble tail pointing to mouth
        ctx.beginPath();
        ctx.moveTo(660, 170);
        ctx.lineTo(580, 240);
        ctx.lineTo(700, 170);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        // Text inside bubble
        ctx.fillStyle = '#d97706';
        ctx.font = '900 48px "Sarabun", sans-serif';
        ctx.fillText('HOORAY! 🎉', 610, 135);

        // Action burst rays behind character
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 6;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          ctx.beginPath();
          ctx.moveTo(512 + Math.cos(a) * 440, 512 + Math.sin(a) * 440);
          ctx.lineTo(512 + Math.cos(a) * 510, 512 + Math.sin(a) * 510);
          ctx.stroke();
        }
      `
    },
    {
      id: 'whisper-quietly',
      base: imgStandUp,
      render: `
        // Student cupping hand beside mouth whispering 🤫
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Cupped hand next to mouth (x=600, y=360)
        ctx.strokeStyle = '#2d1b14';
        ctx.fillStyle = '#fde6d8';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';

        // Forearm coming up to face
        ctx.beginPath();
        ctx.moveTo(640, 540);
        ctx.quadraticCurveTo(680, 440, 620, 360);
        ctx.lineTo(575, 370);
        ctx.quadraticCurveTo(610, 460, 590, 540);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cupped hand curving beside cheek/mouth
        ctx.beginPath();
        ctx.ellipse(580, 350, 32, 45, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Fingers cupping
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(565, 320); ctx.quadraticCurveTo(595, 310, 610, 335);
        ctx.moveTo(560, 340); ctx.quadraticCurveTo(595, 330, 610, 355);
        ctx.stroke();

        // Whisper sound waves (dotted / soft)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(630, 340, 40, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(630, 340, 65, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
        ctx.setLineDash([]);
      `
    },
    {
      id: 'look-surprised',
      base: imgOpenMouth,
      render: `
        // Student surprised with hands to cheeks and wide eyes 😲
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Hands pressed to both cheeks
        ctx.strokeStyle = '#2d1b14';
        ctx.fillStyle = '#fde6d8';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';

        // Left hand on left cheek
        ctx.beginPath();
        ctx.ellipse(260, 610, 38, 55, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Left fingers
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(270, 570); ctx.lineTo(290, 590);
        ctx.moveTo(270, 595); ctx.lineTo(295, 615);
        ctx.stroke();

        // Right hand on right cheek
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(750, 610, 38, 55, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Right fingers
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(740, 570); ctx.lineTo(720, 590);
        ctx.moveTo(740, 595); ctx.lineTo(715, 615);
        ctx.stroke();

        // Surprised shock lines over head
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(430, 120); ctx.lineTo(410, 70);
        ctx.moveTo(512, 100); ctx.lineTo(512, 50);
        ctx.moveTo(594, 120); ctx.lineTo(614, 70);
        ctx.stroke();
      `
    },
    {
      id: 'yawn-sleepy',
      base: imgOpenMouth,
      render: `
        // Student yawning with hand covering mouth, sleepy eyes, Zzz
        ctx.drawImage(baseImg, 0, 0, 1024, 1024);

        // Cover eyes with sleepy half-closed eyelids
        ctx.fillStyle = '#fde6d8';
        ctx.beginPath();
        ctx.rect(290, 450, 150, 50);
        ctx.rect(570, 450, 150, 50);
        ctx.fill();

        // Droopy sleepy eyelid lines
        ctx.strokeStyle = '#2d1b14';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(300, 500); ctx.lineTo(430, 510);
        ctx.moveTo(580, 510); ctx.lineTo(710, 500);
        ctx.stroke();

        // Hand covering yawning mouth
        ctx.strokeStyle = '#2d1b14';
        ctx.fillStyle = '#fde6d8';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.ellipse(512, 690, 60, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sleepy Zzz bubble
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText('Z', 780, 320);
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText('z', 840, 270);
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('z', 885, 230);
      `
    }
  ];

  for (const task of synthTasks) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; background:#ffffff; overflow:hidden;">
        <canvas id="c" width="1024" height="1024"></canvas>
        <script>
          (() => {
            window.__DONE__ = false;
            window.__ERROR__ = null;
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');
            const baseImg = new Image();
            baseImg.onerror = (e) => {
              console.error('Image load failed for ${task.id}');
              window.__ERROR__ = 'Image load failed';
            };
            baseImg.onload = () => {
              try {
                ${task.render}
                window.__DONE__ = true;
              } catch(e) {
                console.error('Render error in ${task.id}:', e.message);
                window.__ERROR__ = e.message;
              }
            };
            baseImg.src = "${task.base}";
          })();
        </script>
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.waitForFunction(() => window.__DONE__ === true || window.__ERROR__ !== null, { timeout: 15000 });
    
    const err = await page.evaluate(() => window.__ERROR__);
    if (err) {
      console.error(`Render failed for ${task.id}: ${err}`);
      await page.close();
      continue;
    }

    // Screenshot canvas
    const buf = await page.locator('#c').screenshot();
    const destPath = path.join(outDir, `${task.id}.webp`);
    await sharp(buf)
      .resize(512, 512, { fit: 'cover' })
      .webp({ quality: 90 })
      .toFile(destPath);
    console.log(`✓ Synthesized and saved ${task.id}.webp (${buf.length} bytes)`);
    await page.close();
  }

  await browser.close();
  console.log('All 26 actions processed successfully!');
}

async function main() {
  await processBaseImages();
  await renderSynthesizedActions();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
