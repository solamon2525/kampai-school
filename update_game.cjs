const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public/games/thai/attack-on-noun/game.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Inject UI Elements
const uiInjection = `
    // --- INJECTED UI ELEMENTS ---
    const extraUI = document.createElement('div');
    extraUI.innerHTML = \`
        <div id="campaign-screen" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.9); z-index:100; color:white; overflow-y:auto; padding:20px;">
            <h2>Story Campaign</h2>
            <div id="stage-grid" style="display:flex; flex-wrap:wrap; gap:10px;"></div>
            <button id="campaign-close" style="margin-top:20px; padding:10px;">Back to Menu</button>
        </div>
        <div id="dialogue-overlay" style="display:none; position:absolute; bottom:20px; left:50%; transform:translateX(-50%); width:80%; max-width:600px; background:rgba(0,0,0,0.8); border:2px solid white; border-radius:10px; padding:20px; z-index:110; color:white;">
            <p id="dialogue-text" style="font-size:20px; margin:0;"></p>
            <button id="dialogue-next" style="margin-top:15px; padding:10px 20px;">Next</button>
        </div>
        <div id="word-report-screen" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.95); z-index:100; color:white; padding:20px; overflow-y:auto;">
            <h2>Word Report</h2>
            <div id="word-report-list" style="margin-bottom:20px;"></div>
            <button id="word-report-close" style="padding:10px;">Close Report</button>
        </div>
        <div id="analytics-screen" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.95); z-index:100; color:white; padding:20px; overflow-y:auto;">
            <h2>Analytics & Mastery</h2>
            <div id="analytics-content"></div>
            <button id="analytics-close" style="padding:10px;">Close Analytics</button>
        </div>
        <div id="skins-screen" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.95); z-index:100; color:white; padding:20px; overflow-y:auto;">
            <h2>Skins & Leveling</h2>
            <div id="skins-content"></div>
            <button id="skins-close" style="padding:10px;">Close Skins</button>
        </div>
        <div style="position:absolute; top:10px; right:10px; z-index:90; display:flex; gap:5px;">
            <button id="analytics-btn" style="display:none; padding:5px 10px; background:#4CAF50; color:white; border:none; border-radius:5px; cursor:pointer;">Analytics</button>
            <button id="skins-btn" style="display:none; padding:5px 10px; background:#FF9800; color:white; border:none; border-radius:5px; cursor:pointer;">Skins</button>
        </div>
    \`;
    document.body.appendChild(extraUI);
    
    // Add Campaign button to start screen if it exists
    const startBtnEl = document.getElementById('start-btn');
    if (startBtnEl && startBtnEl.parentNode) {
        const cBtn = document.createElement('button');
        cBtn.id = 'campaign-btn-main';
        cBtn.className = startBtnEl.className;
        cBtn.innerText = 'Story Campaign';
        cBtn.style.background = '#9c27b0';
        cBtn.style.marginBottom = '10px';
        startBtnEl.parentNode.insertBefore(cBtn, startBtnEl);
        
        document.getElementById('analytics-btn').style.display = 'block';
        document.getElementById('skins-btn').style.display = 'block';
    }
    
    // Add Word Report button to game over screen
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn && restartBtn.parentNode) {
        const wrBtn = document.createElement('button');
        wrBtn.id = 'show-word-report-btn';
        wrBtn.className = restartBtn.className;
        wrBtn.innerText = 'Word Report';
        wrBtn.style.background = '#2196F3';
        wrBtn.style.marginRight = '10px';
        restartBtn.parentNode.insertBefore(wrBtn, restartBtn);
    }
    // --- END INJECTED UI ---
`;

content = content.replace(/(let score = 0, hearts = 5, ammo = 20;)/, uiInjection + '\n    $1');

// 2. Add New State Variables
const newVars = `
    let isCampaignMode = false;
    let currentStageId = 1;
    let campaignDialogueStep = 0;
    let roundWordsTracked = [];
    
    const LEITNER_KEY = 'attack_on_noun_leitner';
    const CAMPAIGN_KEY = 'attack_on_noun_campaign';
    const XP_KEY = 'attack_on_noun_player_progression';
    
    const CFG_STAGES = Array.from({length: 10}, (_, i) => ({
        id: i + 1,
        waves: 2 + i,
        dialogue: [\`Welcome to Stage \${i+1}!\`, i === 9 ? 'A Boss is approaching! Prepare for King Titan!' : \`Get ready to defend the wall!\`]
    }));
    
    const CFG_SKINS = [
        { id: 'default', name: 'Default', color: 0x2196F3 },
        { id: 'wall_guard', name: 'Wall Guard', color: 0x4CAF50 },
        { id: 'armor_guard', name: 'Armor Guard', color: 0x9E9E9E },
        { id: 'hero', name: 'Hero', color: 0xFFD700 },
        { id: 'legend', name: 'Legend', color: 0xFF5722 }
    ];
`;

content = content.replace(/(let kills = 0;)/, newVars + '\n    $1');

// 3. Update getRandomItem (Leitner 5-Box)
const oldGetRandomItem = `        getRandomItem() {
            let list = RAW_DATA.items;
            if (activeCategories.length > 0) {
                list = list.filter(it => activeCategories.includes(it.cat));
            }
            if (!list || list.length === 0) list = RAW_DATA.items;
            return list[Math.floor(qrand() * list.length)];
        }`;
        
const newGetRandomItem = `        getRandomItem() {
            let list = RAW_DATA.items;
            if (activeCategories && activeCategories.length > 0) {
                list = list.filter(it => activeCategories.includes(it.cat));
            }
            if (!list || list.length === 0) list = RAW_DATA.items;
            
            const lData = JSON.parse(localStorage.getItem(LEITNER_KEY)) || {};
            let weightedList = [];
            list.forEach(it => {
                const box = lData[it.n] ? lData[it.n].box : 1;
                let weight = 1;
                if (box === 1) weight = 5;
                else if (box === 2) weight = 3;
                else if (box === 3) weight = 2;
                
                for (let i = 0; i < weight; i++) weightedList.push(it);
            });
            return weightedList[Math.floor(qrand() * weightedList.length)];
        }`;
        
content = content.replace(oldGetRandomItem, newGetRandomItem);

// 4. Update Shooting Logic (Record Word, Update Leitner, Add XP)
// We look for the hit handling block
const correctHitOld = `shotsHit++;
                combo++;`;
const correctHitNew = `shotsHit++;
                combo++;
                // Update Leitner & Track
                updateLeitner(enemy.data.n, true);
                roundWordsTracked.push({ noun: enemy.data.n, correctClassifier: enemy.data.c, userCorrect: true, tip: enemy.data.tip });
                addXP(10);`;
                
const wrongHitOld = `combo = 0;
                wrongWords.push(\`\${enemy.data.n} (, ,-,s \${hit.userData.txt})\`);`;
const wrongHitNew = `combo = 0;
                wrongWords.push(\`\${enemy.data.n} (Selected: \${hit.userData.txt})\`);
                updateLeitner(enemy.data.n, false);
                roundWordsTracked.push({ noun: enemy.data.n, correctClassifier: enemy.data.c, userCorrect: false, tip: enemy.data.tip });`;

content = content.replace(correctHitOld, correctHitNew);
content = content.replace(wrongHitOld, wrongHitNew);

// 5. XP & Leveling Logic
const logicBlock = `
    function getProgression() { return JSON.parse(localStorage.getItem(XP_KEY)) || { xp: 0, level: 1, equippedSkin: 'default', unlockedSkins: ['default'] }; }
    function saveProgression(p) { localStorage.setItem(XP_KEY, JSON.stringify(p)); }
    function addXP(amount) {
        let p = getProgression();
        p.xp += amount;
        let nextLevelReq = p.level * 100;
        let leveledUp = false;
        while (p.xp >= nextLevelReq) {
            p.xp -= nextLevelReq;
            p.level++;
            leveledUp = true;
            nextLevelReq = p.level * 100;
        }
        saveProgression(p);
        if (leveledUp) {
            if(ksdk && ksdk.sound && ksdk.sound.correct) ksdk.sound.correct();
            flashMessage(\`LEVEL UP! Level \${p.level}\`, "#FFD700");
        }
    }
    
    function updateLeitner(noun, correct) {
        const d = JSON.parse(localStorage.getItem(LEITNER_KEY)) || {};
        if (!d[noun]) d[noun] = { box: 1, correctCount: 0, wrongCount: 0, lastTested: 0 };
        d[noun].lastTested = Date.now();
        if (correct) {
            d[noun].box = Math.min(5, d[noun].box + 1);
            d[noun].correctCount++;
        } else {
            d[noun].box = 1;
            d[noun].wrongCount++;
        }
        localStorage.setItem(LEITNER_KEY, JSON.stringify(d));
    }
`;

content = content.replace(/(function activateFever\(\) \{)/, logicBlock + '\n    $1');

// 6. Campaign & Boss logic, update startWave
const waveUpdateOld = `waveTitansKilled = 0;
        waveTitansToSpawn = CFG.WAVE_TITANS[Math.min(currentWave-1, CFG.WAVE_TITANS.length-1)] || 5;`;
const waveUpdateNew = `waveTitansKilled = 0;
        if (isCampaignMode) {
            const st = CFG_STAGES[currentStageId - 1];
            waveTitansToSpawn = 3 + Math.floor(currentWave / 2);
            if (currentWave === st.waves && currentStageId === 10) {
                // Boss Wave!
                const boss = new Titan();
                boss.type = 'colossal';
                boss.hp = 5;
                boss.mesh.scale.set(4, 4, 4);
                // golden aura
                boss.skinMat.color.setHex(0xFFD700);
            }
        } else {
            waveTitansToSpawn = CFG.WAVE_TITANS[Math.min(currentWave-1, CFG.WAVE_TITANS.length-1)] || 5;
        }`;

content = content.replace(waveUpdateOld, waveUpdateNew);

// End game campaign check
const endGameOld = `if (statsWrongWords)`;
const endGameNew = `if (isCampaignMode && win) {
            addXP(50);
            const cData = JSON.parse(localStorage.getItem(CAMPAIGN_KEY)) || { stages: { 1: { stars: 0, completed: false } } };
            let stars = 1;
            if (hearts >= 3) stars++;
            const acc = shotsFired > 0 ? (shotsHit/shotsFired) : 0;
            if (acc >= 0.8) stars++;
            
            if (!cData.stages[currentStageId] || cData.stages[currentStageId].stars < stars) {
                cData.stages[currentStageId] = { stars, completed: true };
            }
            // Unlocks
            let p = getProgression();
            if (currentStageId >= 3 && !p.unlockedSkins.includes('wall_guard')) p.unlockedSkins.push('wall_guard');
            if (currentStageId >= 5 && !p.unlockedSkins.includes('armor_guard')) p.unlockedSkins.push('armor_guard');
            if (currentStageId >= 10 && !p.unlockedSkins.includes('hero')) p.unlockedSkins.push('hero');
            saveProgression(p);
            
            if (currentStageId < 10) {
                cData.stages[currentStageId + 1] = cData.stages[currentStageId + 1] || { stars: 0, completed: false };
            }
            localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(cData));
        }
        
        if (statsWrongWords)`;
content = content.replace(endGameOld, endGameNew);

// Skin Application
const skinApplyOld = `playerMesh.material = mat;`;
const skinApplyNew = `playerMesh.material = mat;
        let pProg = JSON.parse(localStorage.getItem(XP_KEY)) || { equippedSkin: 'default' };
        let sk = CFG_SKINS.find(s => s.id === pProg.equippedSkin) || CFG_SKINS[0];
        mat.color.setHex(sk.color);`;
content = content.replace(skinApplyOld, skinApplyNew);

// Reset tracked words
const resetOld = `wrongWords = [];
        currentWave = 1;`;
const resetNew = `wrongWords = [];
        roundWordsTracked = [];
        currentWave = 1;`;
content = content.replace(resetOld, resetNew);

// 7. Event Listeners for New UI
const listenersBlock = `
    const campBtn = document.getElementById('campaign-btn-main');
    if (campBtn) campBtn.addEventListener('click', () => {
        const grid = document.getElementById('stage-grid');
        grid.innerHTML = '';
        const cData = JSON.parse(localStorage.getItem(CAMPAIGN_KEY)) || { stages: { 1: { stars: 0, completed: false } } };
        CFG_STAGES.forEach(st => {
            const sd = cData.stages[st.id] || { stars: 0 };
            const locked = st.id !== 1 && (!cData.stages[st.id - 1] || !cData.stages[st.id - 1].completed);
            const card = document.createElement('div');
            card.style = \`border:1px solid #fff; padding:10px; width:120px; text-align:center; cursor:\${locked ? 'not-allowed' : 'pointer'}; opacity:\${locked ? 0.5 : 1}\`;
            card.innerHTML = \`<h3>Stage \${st.id}</h3><div>\${'⭐'.repeat(sd.stars)}</div>\`;
            if (!locked) {
                card.onclick = () => {
                    currentStageId = st.id;
                    isCampaignMode = true;
                    document.getElementById('campaign-screen').style.display = 'none';
                    campaignDialogueStep = 0;
                    document.getElementById('dialogue-overlay').style.display = 'block';
                    document.getElementById('dialogue-text').innerText = CFG_STAGES[st.id - 1].dialogue[0];
                };
            }
            grid.appendChild(card);
        });
        document.getElementById('campaign-screen').style.display = 'block';
    });
    
    document.getElementById('campaign-close')?.addEventListener('click', () => {
        document.getElementById('campaign-screen').style.display = 'none';
    });
    
    document.getElementById('dialogue-next')?.addEventListener('click', () => {
        campaignDialogueStep++;
        const lines = CFG_STAGES[currentStageId - 1].dialogue;
        if (campaignDialogueStep < lines.length) {
            document.getElementById('dialogue-text').innerText = lines[campaignDialogueStep];
        } else {
            document.getElementById('dialogue-overlay').style.display = 'none';
            startGame(false);
        }
    });
    
    document.getElementById('show-word-report-btn')?.addEventListener('click', () => {
        const list = document.getElementById('word-report-list');
        list.innerHTML = '';
        roundWordsTracked.forEach(w => {
            const div = document.createElement('div');
            div.style = 'margin-bottom:10px; border-bottom:1px solid #555; padding-bottom:10px;';
            div.innerHTML = \`
                <strong>\${w.noun}</strong> - Classifier: \${w.correctClassifier}
                <span style="color:\${w.userCorrect ? '#4CAF50' : '#F44336'}">(\${w.userCorrect ? 'Correct' : 'Incorrect'})</span>
                \${w.tip ? \`<br><small>\${w.tip}</small>\` : ''}
                <button onclick="if(window.KAMPAI && KAMPAI.sound) KAMPAI.sound.speak('\${w.noun} \${w.correctClassifier}', 'th')" style="margin-left:10px; padding:2px 5px;">🔊</button>
            \`;
            list.appendChild(div);
        });
        document.getElementById('word-report-screen').style.display = 'block';
    });
    
    document.getElementById('word-report-close')?.addEventListener('click', () => {
        document.getElementById('word-report-screen').style.display = 'none';
    });
    
    document.getElementById('analytics-btn')?.addEventListener('click', () => {
        const d = JSON.parse(localStorage.getItem(LEITNER_KEY)) || {};
        let mastered = 0, learning = 0;
        let missed = [];
        Object.keys(d).forEach(k => {
            if (d[k].box >= 4) mastered++; else learning++;
            if (d[k].wrongCount > 0) missed.push({ n: k, w: d[k].wrongCount });
        });
        missed.sort((a,b) => b.w - a.w);
        
        const content = document.getElementById('analytics-content');
        content.innerHTML = \`
            <p>Mastered Words (Box 4-5): \${mastered}</p>
            <p>Learning Words (Box 1-3): \${learning}</p>
            <h3>Top 5 Missed Words:</h3>
            <ul>
                \${missed.slice(0, 5).map(m => \`<li>\${m.n} (\${m.w} misses)</li>\`).join('')}
            </ul>
        \`;
        document.getElementById('analytics-screen').style.display = 'block';
    });
    
    document.getElementById('analytics-close')?.addEventListener('click', () => {
        document.getElementById('analytics-screen').style.display = 'none';
    });
    
    document.getElementById('skins-btn')?.addEventListener('click', () => {
        const p = getProgression();
        const content = document.getElementById('skins-content');
        content.innerHTML = \`<p>Level: \${p.level} (XP: \${p.xp} / \${p.level * 100})</p>\`;
        
        CFG_SKINS.forEach(sk => {
            const btn = document.createElement('button');
            const unlocked = p.unlockedSkins.includes(sk.id);
            btn.innerText = \`\${sk.name} \${p.equippedSkin === sk.id ? '(Equipped)' : (unlocked ? '' : '(Locked)')}\`;
            btn.style = \`display:block; margin:10px 0; padding:10px; background:\${unlocked ? '#' + sk.color.toString(16).padStart(6, '0') : '#555'}; color:white;\`;
            if (unlocked) {
                btn.onclick = () => {
                    p.equippedSkin = sk.id;
                    saveProgression(p);
                    playerMesh.material.color.setHex(sk.color);
                    document.getElementById('skins-close').click();
                };
            }
            content.appendChild(btn);
        });
        
        document.getElementById('skins-screen').style.display = 'block';
    });
    
    document.getElementById('skins-close')?.addEventListener('click', () => {
        document.getElementById('skins-screen').style.display = 'none';
    });
`;

content = content.replace(/(if\(startBtn\) startBtn.addEventListener\('click', \(\) => startGame\(false\)\);)/, listenersBlock + '\n    $1');

fs.writeFileSync(file, content, 'utf8');
console.log('Update successful!');
