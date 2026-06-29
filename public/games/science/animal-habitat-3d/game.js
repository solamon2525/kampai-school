/* game.js — ลอจิกเกมหลักและระบบเรนเดอร์ 3 มิติ (Three.js) */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

// ตั้งค่าระบบเสียงและ Slug ของ SDK
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

// ── ข้อมูลผู้เล่นและตารางคะแนน (วัฒนธรรมมาตรฐาน) ──
function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    if (!s) return;
    const chip = document.getElementById('player-chip');
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
    chip.style.display = 'flex';
}

function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    document.getElementById('ms-best').innerText = (st.personalBest || 0).toLocaleString();
    document.getElementById('ms-plays').innerText = (st.playsCount || 0).toLocaleString();
}

function renderLeaderboard(listId) {
    const el = document.getElementById(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = rows.slice(0, 5).map((r) => {
        const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="">` : `<div class="lb-avatar-init">${(r.displayName||'?')[0]}</div>`;
        return `<li class="${r.isMe ? 'is-me' : ''}">
            <span class="lb-rank">${medals[r.rank-1] || r.rank}</span>${av}
            <div class="lb-info">
                <div class="lb-name">${r.displayName}${r.isMe ? ' (คุณ)' : ''}</div>
                <div class="lb-sub">${(r.personalBest||0).toLocaleString()} คะแนน · ${r.classLabel||''}</div>
            </div>
        </li>`;
    }).join('');
}

KAMPAI.onReady(function() {
    renderPlayer();
    renderMyStats();
    renderLeaderboard('score-list');
});

// เปิดระบบ Versus / Online
let roundActive = false;
const vs = KampaiVersus.create({
    duration: CFG.ONLINE_DURATION,
    title: 'แข่งคัดแยกสัตว์ 3 มิติ',
    rankBy: 'score',
    onPlay: ({ rng, player }) => startRound(rng, player),
    onEnd: () => { 
        inputLocked = true;
        roundActive = false;
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();
    }
});

KAMPAI.sound.mountToggles();

/* ═══════════════════════════════════════════════════════════════════════════
   THREE.JS 3D ENGINE & GRAPHICS (ใช้ Kampai3D Framework)
   ═══════════════════════════════════════════════════════════════════════════ */
let k3d;
let scene, camera, renderer;
let islandGroup, spawnPlatform;
let quadrantMeshes = [];
let currentAnimalMesh = null;
const container = document.getElementById('canvas-container');

const hasTHREE = window.THREE && typeof window.THREE.Scene === 'function' && !window.THREE.Scene.toString().includes('noop');

function init3D() {
    if (!hasTHREE) return;

    // สร้างระบบ 3D ด้วย Kampai3D Framework
    k3d = Kampai3D.create({
        container: container,
        cameraPos: { x: 0, y: 10, z: 16 },
        cameraLookAt: { x: 0, y: 0.5, z: 0 },
        dragRotate: true,
        dragSpeed: 0.008,
        idleRotateSpeed: 0.08,
        shadows: true,
        hemisphereLight: true,
        backgroundColor: 0x0b132a,
        fogColor: 0x0b132a,
        fogDensity: 0.015,
        onUpdate: (delta, time) => {
            // ขยับขึ้นลงเอฟเฟกต์เบาๆ ของตัวเกาะลอยฟ้า (Bobbing)
            if (islandGroup) {
                islandGroup.position.y = Math.sin(time * 0.8) * 0.12 - 0.2;
            }

            // แอนิเมชันสัตว์ขยับอยู่บนแท่นสปอว์นกลาง (Bobbing & Rotating)
            if (currentAnimalMesh && !animationActive) {
                currentAnimalMesh.position.y = 2.35 + Math.sin(time * 4) * 0.08;
                currentAnimalMesh.rotation.y = time * 0.7;
            }

            // แอนิเมชันขณะที่สัตว์เคลื่อนที่เดินทางไปถิ่นที่อยู่ (Transition Animation)
            if (animationActive && currentAnimalMesh) {
                animationProgress += delta * 1.6;
                if (animationProgress >= 1) {
                    // จบแอนิเมชัน!
                    animationActive = false;
                    if (animationSuccess) {
                        // ถูกต้อง: สัตว์ลงไปจอดตรงแผ่นดินถิ่นที่อยู่
                        currentAnimalMesh.position.copy(animEndPos);
                        currentAnimalMesh.rotation.set(0, Math.random() * Math.PI, 0);
                        islandGroup.add(currentAnimalMesh);
                        
                        const danceMesh = currentAnimalMesh;
                        const danceOffset = Math.random() * 5;
                        const danceInterval = setInterval(() => {
                            if (isGameOver || !danceMesh.parent) {
                                clearInterval(danceInterval);
                                return;
                            }
                            const dt = Date.now() / 200;
                            danceMesh.position.y = 0.45 + Math.abs(Math.sin(dt + danceOffset)) * 0.4;
                        }, 30);
                        
                        danceMesh.userData.danceIntervalId = danceInterval;
                        danceMesh.name = "animal_placed_" + Date.now();
                    } else {
                        // ผิด: ตกน้ำทะเลหายไป
                        scene.remove(currentAnimalMesh);
                        currentAnimalMesh = null;
                    }
                    setTimeout(spawnAnimal, CFG.NEXT_SPAWN_DELAY_MS);
                } else {
                    const p = animationProgress;
                    const currentY = THREE.MathUtils.lerp(animStartPos.y, animEndPos.y, p) + Math.sin(p * Math.PI) * 1.5;
                    const currentX = THREE.MathUtils.lerp(animStartPos.x, animEndPos.x, p);
                    const currentZ = THREE.MathUtils.lerp(animStartPos.z, animEndPos.z, p);
                    
                    currentAnimalMesh.position.set(currentX, currentY, currentZ);
                    currentAnimalMesh.rotation.x = p * Math.PI * 2;
                    currentAnimalMesh.rotation.y += delta * 5;
                    
                    if (!animationSuccess) {
                        const scale = 1 - p;
                        currentAnimalMesh.scale.setScalar(scale);
                    }
                }
            }
        }
    });

    scene = k3d.scene;
    camera = k3d.camera;
    renderer = k3d.renderer;
    islandGroup = k3d.group;

    createFloatingIsland();
    createCenterSpawnPlatform();

    // 5. ตรวจสอบการลากเมาส์/สัมผัสเพื่อหมุนเกาะ
    setupInteraction();

    window.addEventListener('resize', onWindowResize);
}

// ช่วยวาดวัตถุสไตล์ Voxel (Box)
function createVoxel(w, h, d, color, px, py, pz, rx = 0, ry = 0, rz = 0) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshPhongMaterial({
        color: color,
        flatShading: true,
        shininess: 30
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// สร้างเกาะลอยฟ้าแบ่งเป็น 4 ส่วน
function createFloatingIsland() {
    quadrantMeshes = [];
    
    // ขนาดของแต่ละฝั่ง
    const platSize = 5.2;
    const platHeight = 1.2;
    const topThickness = 0.3;
    const soilThickness = platHeight - topThickness;
    const gap = 0.15;
    const dist = platSize / 2 + gap;

    // การจัดตำแหน่ง 2x2: x, z
    const positions = [
        { id: 'forest', x: -dist, z: -dist, topColor: 0x3b7a57, soilColor: 0x7c4700 }, // Top-Left: ป่าไม้
        { id: 'desert', x: dist, z: -dist, topColor: 0xeed9b3, soilColor: 0xd2b48c },  // Top-Right: ทะเลทราย
        { id: 'arctic', x: -dist, z: dist, topColor: 0xf0fdfa, soilColor: 0xa5f3fc },  // Bottom-Left: ขั้วโลก
        { id: 'ocean', x: dist, z: dist, topColor: 0x1d4ed8, soilColor: 0x1e3a8a }     // Bottom-Right: มหาสมุทร
    ];

    positions.forEach((pos) => {
        const quadGroup = new THREE.Group();
        quadGroup.position.set(pos.x, 0, pos.z);

        // ดินชั้นล่าง (Soil/Base)
        const soil = createVoxel(platSize, soilThickness, platSize, pos.soilColor, 0, -soilThickness/2, 0);
        quadGroup.add(soil);

        // ดินชั้นบน (Top Layer)
        const topLayer = createVoxel(platSize, topThickness, platSize, pos.topColor, 0, topThickness/2, 0);
        // เก็บ ID ถิ่นที่อยู่ไว้เช็ค Raycasting
        topLayer.userData.habitatId = pos.id;
        quadGroup.add(topLayer);
        quadrantMeshes.push(topLayer);

        // เพิ่มการตกแต่งในแต่ละถิ่นที่อยู่ (Trees, Cacti, Icebergs, Coral)
        addHabitatDecorations(pos.id, quadGroup, platSize);

        islandGroup.add(quadGroup);
    });

    // น้ำทะเลจำลองล้อมรอบเกาะ (แผ่นกระจกสีฟ้ากึ่งโปร่งใส)
    const waterGeo = new THREE.BoxGeometry(24, 0.2, 24);
    const waterMat = new THREE.MeshPhongMaterial({
        color: 0x0e7490,
        transparent: true,
        opacity: 0.6,
        shininess: 80
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -0.7;
    water.receiveShadow = true;
    islandGroup.add(water);
}

// ตกแต่งถิ่นที่อยู่เพิ่มเติมเพื่อความสมบูรณ์แบบ
function addHabitatDecorations(type, group, size) {
    const half = size / 2;
    if (type === 'forest') {
        // ต้นไม้สไตล์ Voxel (ลำต้นสีน้ำตาล + พุ่มไม้สีเขียว)
        const treePositions = [
            { x: -1.2, z: -1.2 }, { x: 1.2, z: -1.0 }, { x: -0.8, z: 1.2 }
        ];
        treePositions.forEach(p => {
            const trunk = createVoxel(0.2, 0.8, 0.2, 0x5c4033, p.x, 0.7, p.z);
            const leaves = createVoxel(0.7, 0.7, 0.7, 0x15803d, p.x, 1.4, p.z);
            group.add(trunk);
            group.add(leaves);
        });
    } else if (type === 'desert') {
        // ต้นกระบองเพชร (ลำต้น + กิ่งยื่น)
        const cactusPositions = [
            { x: -1.0, z: -0.8 }, { x: 1.0, z: 1.0 }
        ];
        cactusPositions.forEach(p => {
            const main = createVoxel(0.18, 0.9, 0.18, 0x16a34a, p.x, 0.75, p.z);
            const armL = createVoxel(0.22, 0.18, 0.1, 0x16a34a, p.x - 0.15, 0.85, p.z);
            const armL2 = createVoxel(0.1, 0.25, 0.1, 0x16a34a, p.x - 0.22, 0.98, p.z);
            group.add(main);
            group.add(armL);
            group.add(armL2);
        });
    } else if (type === 'arctic') {
        // ภูเขาน้ำแข็งเล็กๆ
        const icePositions = [
            { x: -1.0, z: 1.0, s: 0.8 }, { x: 1.0, z: -1.0, s: 0.6 }
        ];
        icePositions.forEach(p => {
            const ice = createVoxel(p.s, p.s * 1.2, p.s, 0xe0f7fa, p.x, p.s * 0.6 + 0.3, p.z, 0, Math.random(), 0);
            group.add(ice);
        });
    } else if (type === 'ocean') {
        // ปะการังและสาหร่ายในน้ำ
        const marinePositions = [
            { x: -1.2, z: 0.8, color: 0xf43f5e }, { x: 0.8, z: -1.2, color: 0xeab308 }
        ];
        marinePositions.forEach(p => {
            const coral1 = createVoxel(0.15, 0.6, 0.15, p.color, p.x, 0.6, p.z, 0.1, 0, 0);
            const coral2 = createVoxel(0.15, 0.5, 0.15, p.color, p.x + 0.1, 0.55, p.z - 0.1, -0.1, 0.2, 0.1);
            group.add(coral1);
            group.add(coral2);
        });
    }
}

// แท่นลอยตัวกลางตรงท้องฟ้า
function createCenterSpawnPlatform() {
    const group = new THREE.Group();
    group.position.set(0, 2.2, 0);

    // แท่นหินวงกลมหนา
    const slab = createVoxel(2.4, 0.3, 2.4, 0x475569, 0, 0, 0);
    group.add(slab);

    // เสาคริสตัลพลังงานด้านล่างแท่นช่วยพยุง
    const crystal = createVoxel(0.5, 1.2, 0.5, 0xa855f7, 0, -0.7, 0);
    group.add(crystal);

    islandGroup.add(group);
    spawnPlatform = group;
}

// ── การประกอบโมเดลสัตว์สามมิติ (Procedural Voxel Assemblies) ──
function buildVoxelAnimal(id) {
    const group = new THREE.Group();
    group.name = "animal_" + id;

    if (id === 'monkey') {
        // ลิง: ตัว หัว หาง หู หน้า แขนขา
        group.add(createVoxel(0.46, 0.55, 0.46, 0x7c2d12, 0, 0, 0)); // ตัว
        group.add(createVoxel(0.38, 0.38, 0.38, 0x7c2d12, 0, 0.45, 0.05)); // หัว
        group.add(createVoxel(0.28, 0.28, 0.05, 0xfed7aa, 0, 0.4, 0.24)); // หน้าตูม
        group.add(createVoxel(0.08, 0.08, 0.08, 0x111111, 0, 0.42, 0.27)); // จมูก
        group.add(createVoxel(0.12, 0.12, 0.08, 0x7c2d12, -0.22, 0.48, 0.05)); // หูซ้าย
        group.add(createVoxel(0.12, 0.12, 0.08, 0x7c2d12, 0.22, 0.48, 0.05)); // หูขวา
        group.add(createVoxel(0.14, 0.35, 0.14, 0x7c2d12, -0.22, -0.3, 0.1)); // ขาซ้าย
        group.add(createVoxel(0.14, 0.35, 0.14, 0x7c2d12, 0.22, -0.3, 0.1)); // ขาขวา
        group.add(createVoxel(0.1, 0.1, 0.5, 0x7c2d12, 0, -0.15, -0.4)); // หาง
    }
    else if (id === 'deer') {
        // กวาง: ตัว คอ หัว ขา เขาเล็กๆ
        group.add(createVoxel(0.45, 0.45, 0.85, 0xb45309, 0, 0.05, 0)); // ตัว
        group.add(createVoxel(0.18, 0.6, 0.18, 0xb45309, 0, 0.45, 0.3)); // คอยาว
        group.add(createVoxel(0.22, 0.22, 0.32, 0xb45309, 0, 0.75, 0.38)); // หัว
        group.add(createVoxel(0.06, 0.25, 0.06, 0xffffff, -0.08, 0.95, 0.35, 0.2, 0, -0.1)); // เขาซ้าย
        group.add(createVoxel(0.06, 0.25, 0.06, 0xffffff, 0.08, 0.95, 0.35, 0.2, 0, 0.1)); // เขาขวา
        const legW = 0.08, legH = 0.55;
        group.add(createVoxel(legW, legH, legW, 0xb45309, -0.18, -0.35, 0.3));
        group.add(createVoxel(legW, legH, legW, 0xb45309, 0.18, -0.35, 0.3));
        group.add(createVoxel(legW, legH, legW, 0xb45309, -0.18, -0.35, -0.3));
        group.add(createVoxel(legW, legH, legW, 0xb45309, 0.18, -0.35, -0.3));
    }
    else if (id === 'squirrel') {
        // กระรอก: ตัว หัว และหางม้วนฟูงอนขึ้นด้านบน
        group.add(createVoxel(0.35, 0.42, 0.35, 0xd97706, 0, -0.05, 0)); // ตัว
        group.add(createVoxel(0.26, 0.26, 0.26, 0xd97706, 0, 0.26, 0.05)); // หัว
        group.add(createVoxel(0.24, 0.38, 0.24, 0x9a3412, 0, 0.15, -0.28)); // หางม้วนขึ้น
        group.add(createVoxel(0.18, 0.1, 0.15, 0xd97706, -0.15, -0.35, 0.1)); // แขนขา
        group.add(createVoxel(0.18, 0.1, 0.15, 0xd97706, 0.15, -0.35, 0.1));
    }
    else if (id === 'camel') {
        // อูฐ: ตัว โหนก คอเฉียง หัวยาว ขา
        group.add(createVoxel(0.5, 0.55, 0.95, 0xb45309, 0, 0.1, 0)); // ตัว
        group.add(createVoxel(0.4, 0.28, 0.45, 0x7c2d12, 0, 0.48, 0)); // โหนก
        group.add(createVoxel(0.2, 0.65, 0.2, 0xb45309, 0, 0.55, 0.35, 0.3, 0, 0)); // คอเฉียง
        group.add(createVoxel(0.22, 0.22, 0.38, 0xb45309, 0, 0.85, 0.55)); // หัวยาว
        const cLegW = 0.09, cLegH = 0.65;
        group.add(createVoxel(cLegW, cLegH, cLegW, 0xb45309, -0.2, -0.4, 0.35));
        group.add(createVoxel(cLegW, cLegH, cLegW, 0xb45309, 0.2, -0.4, 0.35));
        group.add(createVoxel(cLegW, cLegH, cLegW, 0xb45309, -0.2, -0.4, -0.35));
        group.add(createVoxel(cLegW, cLegH, cLegW, 0xb45309, 0.2, -0.4, -0.35));
    }
    else if (id === 'fennec_fox') {
        // จิ้งจอกหูใหญ่: ตัว หัว หูโตมากๆ หาง
        group.add(createVoxel(0.32, 0.35, 0.55, 0xfef08a, 0, -0.05, 0)); // ตัว
        group.add(createVoxel(0.26, 0.24, 0.26, 0xfef08a, 0, 0.22, 0.2)); // หัว
        group.add(createVoxel(0.1, 0.38, 0.22, 0xfbcfe8, -0.15, 0.45, 0.15, 0, 0, -0.4)); // หูขวาโตเฉียง
        group.add(createVoxel(0.1, 0.38, 0.22, 0xfbcfe8, 0.15, 0.45, 0.15, 0, 0, 0.4)); // หูซ้ายโตเฉียง
        group.add(createVoxel(0.12, 0.12, 0.32, 0xd97706, 0, 0.05, -0.38)); // หาง
        const fLegW = 0.07, fLegH = 0.32;
        group.add(createVoxel(fLegW, fLegH, fLegW, 0xfef08a, -0.12, -0.32, 0.18));
        group.add(createVoxel(fLegW, fLegH, fLegW, 0xfef08a, 0.12, -0.32, 0.18));
        group.add(createVoxel(fLegW, fLegH, fLegW, 0xfef08a, -0.12, -0.32, -0.18));
        group.add(createVoxel(fLegW, fLegH, fLegW, 0xfef08a, 0.12, -0.32, -0.18));
    }
    else if (id === 'scorpion') {
        // แมงป่อง: ลำตัวแบบแบน ก้ามใหญ่ ขาถ่าง และหางที่งอม้วนชี้ขึ้นด้านบน
        group.add(createVoxel(0.45, 0.15, 0.65, 0x1e293b, 0, -0.15, 0)); // ลำตัวแบน
        group.add(createVoxel(0.18, 0.14, 0.25, 0x1e293b, -0.28, -0.05, 0.28, 0, 0.4, 0)); // ก้ามขวา
        group.add(createVoxel(0.18, 0.14, 0.25, 0x1e293b, 0.28, -0.05, 0.28, 0, -0.4, 0)); // ก้ามซ้าย
        group.add(createVoxel(0.1, 0.4, 0.1, 0x475569, 0, 0.18, -0.35, 0.5, 0, 0)); // หางส่วนล่าง
        group.add(createVoxel(0.08, 0.3, 0.08, 0xe11d48, 0, 0.35, -0.2, 1.1, 0, 0)); // ปลายหางมีพิษสีแดง
    }
    else if (id === 'polar_bear') {
        // หมีขั้วโลก: ตัวใหญ่โต หัว หน้ายื่น เท้าใหญ่
        group.add(createVoxel(0.68, 0.62, 1.1, 0xf1f5f9, 0, 0.1, 0)); // ตัวหนา
        group.add(createVoxel(0.38, 0.38, 0.38, 0xf1f5f9, 0, 0.42, 0.4)); // หัว
        group.add(createVoxel(0.2, 0.18, 0.2, 0xe2e8f0, 0, 0.38, 0.62)); // จมูกยื่น
        group.add(createVoxel(0.08, 0.08, 0.08, 0x0f172a, 0, 0.44, 0.72)); // จมูกดำ
        const bearLegW = 0.18, bearLegH = 0.52;
        group.add(createVoxel(bearLegW, bearLegH, bearLegW, 0xf1f5f9, -0.22, -0.35, 0.35));
        group.add(createVoxel(bearLegW, bearLegH, bearLegW, 0xf1f5f9, 0.22, -0.35, 0.35));
        group.add(createVoxel(bearLegW, bearLegH, bearLegW, 0xf1f5f9, -0.22, -0.35, -0.35));
        group.add(createVoxel(bearLegW, bearLegH, bearLegW, 0xf1f5f9, 0.22, -0.35, -0.35));
    }
    else if (id === 'penguin') {
        // เพนกวิน: ลำตัวดำ พุงขาว ปีก ครีบ ปากสีส้ม
        group.add(createVoxel(0.48, 0.75, 0.42, 0x0f172a, 0, 0.15, 0)); // ลำตัวดำ
        group.add(createVoxel(0.38, 0.55, 0.05, 0xffffff, 0, 0.05, 0.20)); // พุงขาว
        group.add(createVoxel(0.18, 0.1, 0.18, 0xeab308, 0, 0.42, 0.25)); // ปากส้ม
        group.add(createVoxel(0.06, 0.42, 0.18, 0x0f172a, -0.26, 0.15, 0, 0, 0, 0.25)); // ปีกขวา
        group.add(createVoxel(0.06, 0.42, 0.18, 0x0f172a, 0.26, 0.15, 0, 0, 0, -0.25)); // ปีกซ้าย
        group.add(createVoxel(0.18, 0.05, 0.25, 0xeab308, -0.16, -0.25, 0.1)); // ตีนขวา
        group.add(createVoxel(0.18, 0.05, 0.25, 0xeab308, 0.16, -0.25, 0.1)); // ตีนซ้าย
    }
    else if (id === 'arctic_fox') {
        // จิ้งจอกขั้วโลก: ตัวขาวนวล หัว หางฟู ขาสั้น
        group.add(createVoxel(0.32, 0.35, 0.58, 0xf8fafc, 0, -0.05, 0)); // ลำตัวขาว
        group.add(createVoxel(0.24, 0.24, 0.24, 0xf8fafc, 0, 0.22, 0.2)); // หัว
        group.add(createVoxel(0.08, 0.18, 0.08, 0xf8fafc, -0.1, 0.38, 0.2)); // หูขวา
        group.add(createVoxel(0.08, 0.18, 0.08, 0xf8fafc, 0.1, 0.38, 0.2)); // หูซ้าย
        group.add(createVoxel(0.15, 0.15, 0.35, 0xf1f5f9, 0, 0.05, -0.38)); // หางฟู
        const aLegW = 0.08, aLegH = 0.32;
        group.add(createVoxel(aLegW, aLegH, aLegW, 0xf8fafc, -0.12, -0.32, 0.18));
        group.add(createVoxel(aLegW, aLegH, aLegW, 0xf8fafc, 0.12, -0.32, 0.18));
        group.add(createVoxel(aLegW, aLegH, aLegW, 0xf8fafc, -0.12, -0.32, -0.18));
        group.add(createVoxel(aLegW, aLegH, aLegW, 0xf8fafc, 0.12, -0.32, -0.18));
    }
    else if (id === 'shark') {
        // ฉลาม: ลำตัวทรงรียาว ครีบบน ครีบข้าง หางแนวตั้ง
        group.add(createVoxel(0.45, 0.45, 1.15, 0x475569, 0, 0, 0)); // ตัว
        group.add(createVoxel(0.08, 0.35, 0.28, 0x475569, 0, 0.38, -0.1)); // ครีบบน
        group.add(createVoxel(0.35, 0.06, 0.2, 0x475569, -0.35, -0.15, 0.1, 0, 0.2, 0.2)); // ครีบข้างขวา
        group.add(createVoxel(0.35, 0.06, 0.2, 0x475569, 0.35, -0.15, 0.1, 0, -0.2, -0.2)); // ครีบข้างซ้าย
        group.add(createVoxel(0.06, 0.45, 0.28, 0x334155, 0, 0, -0.68)); // ครีบหางตั้ง
    }
    else if (id === 'whale') {
        // วาฬ: ตัวยักษ์น้ำเงินเข้ม พุงเทา ครีบแบนราบ
        group.add(createVoxel(0.65, 0.58, 1.25, 0x1e3a8a, 0, 0.08, 0)); // ตัวยักษ์
        group.add(createVoxel(0.62, 0.12, 1.1, 0x94a3b8, 0, -0.26, 0.05)); // พุงใต้ท้องสีเทา
        group.add(createVoxel(0.35, 0.06, 0.18, 0x1e3a8a, -0.45, -0.1, 0)); // ครีบข้างขวา
        group.add(createVoxel(0.35, 0.06, 0.18, 0x1e3a8a, 0.45, -0.1, 0)); // ครีบข้างซ้าย
        group.add(createVoxel(0.48, 0.06, 0.32, 0x1e3a8a, 0, 0.15, -0.75)); // หางวาฬแนวนอน
    }
    else if (id === 'crab') {
        // ปู: ตัวกระดองแบนสีแดง ก้ามหนีบคู่หนา ขาเดินชี้ออก
        group.add(createVoxel(0.62, 0.22, 0.48, 0xdc2626, 0, -0.1, 0)); // กระดองปูแดง
        group.add(createVoxel(0.22, 0.18, 0.22, 0xdc2626, -0.32, 0.02, 0.24, 0, 0.5, 0)); // ก้ามขวาหนา
        group.add(createVoxel(0.22, 0.18, 0.22, 0xdc2626, 0.32, 0.02, 0.24, 0, -0.5, 0)); // ก้ามซ้ายหนา
        group.add(createVoxel(0.08, 0.08, 0.08, 0x111111, -0.18, 0.1, 0.24)); // ลูกตาขวา
        group.add(createVoxel(0.08, 0.08, 0.08, 0x111111, 0.18, 0.1, 0.24)); // ลูกตาซ้าย
        const cLegW = 0.06, cLegH = 0.25;
        // ขาชี้ข้างหลายๆ ขา
        for (let i = -1; i <= 1; i += 1) {
            group.add(createVoxel(cLegW, cLegH, 0.06, 0xb91c1c, -0.32, -0.22, i * 0.14, 0, 0, 0.4));
            group.add(createVoxel(cLegW, cLegH, 0.06, 0xb91c1c, 0.32, -0.22, i * 0.14, 0, 0, -0.4));
        }
    }

    // ปรับขนาดของสัตว์ตามสัดส่วนที่ระบุใน data
    const info = DATA.ANIMALS.find(a => a.id === id);
    if (info && info.size) {
        group.scale.setScalar(info.size);
    }
    return group;
}

function getScreenPosition(object) {
    if (k3d) return k3d.getScreenPosition(object);
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAMEPLAY LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
let mode = 'adventure', score = 0, lives = CFG.LIVES, level = 1, combo = 0;
let classifiedCount = 0, isGameOver = false, started = false;
let inputLocked = false;
let timeLeft = CFG.TIME_SECONDS, timerIntervalId = null;

let currentAnimal = null;
let rngGenerator = Math.random;

// สุ่มสัตว์
function getNextAnimal() {
    const list = DATA.ANIMALS;
    return list[Math.floor(rngGenerator() * list.length)];
}

const $ = (id) => document.getElementById(id);

function setScore(n) {
    score = Math.max(0, n);
    $('score-value').innerText = score;
    const sContainer = $('score-container');
    sContainer.classList.add('pop');
    setTimeout(() => sContainer.classList.remove('pop'), 150);
}

function setLives(n) {
    lives = Math.max(0, n);
    let s = '';
    for (let i = 0; i < CFG.LIVES; i++) {
        s += (i < lives) ? '❤️' : '🖤';
    }
    $('life-container').innerText = s;
    if (lives <= 0 && mode === 'adventure') {
        endGame();
    }
}

function updateComboBadge() {
    const b = $('combo-badge');
    const mult = getComboMultiplier();
    if (mult > 1) {
        b.innerText = `🔥 คอมโบ x${mult}`;
        b.style.display = 'block';
        b.classList.add('bump');
        setTimeout(() => b.classList.remove('bump'), 120);
    } else {
        b.style.display = 'none';
    }
}

function getComboMultiplier() {
    return Math.min(CFG.COMBO_MAX, 1 + Math.floor(combo / CFG.COMBO_STEP));
}

// เอฟเฟกต์สีสันแตกกระจาย (Particles)
function burst(x, y, colorHex) {
    const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = (Math.PI * 2 / 12) * i;
        const dist = 40 + Math.random() * 50;
        const size = 6 + Math.random() * 8;
        p.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${colorStr};
            --dx: ${(Math.cos(angle) * dist) | 0}px;
            --dy: ${(Math.sin(angle) * dist) | 0}px;
        `;
        document.body.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }
}

// คะแนนเด้งลอยฟูขึ้่นมา
function scorePop(x, y, text, colorHex) {
    const colorStr = typeof colorHex === 'string' ? colorHex : '#' + colorHex.toString(16).padStart(6, '0');
    const el = document.createElement('div');
    el.className = 'score-pop';
    el.textContent = text;
    el.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        color: ${colorStr};
        font-size: ${22 + getComboMultiplier() * 3}px;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
}

function shakeScreen() {
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
}

function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// สปอว์นสัตว์
function spawnAnimal() {
    if (isGameOver) return;
    if ((mode === 'versus' || mode === 'online') && !roundActive) return;
    inputLocked = false;
    currentAnimal = getNextAnimal();

    // ทำลายโมเดลเดิมถ้ามีค้าง
    if (currentAnimalMesh && scene) {
        scene.remove(currentAnimalMesh);
        currentAnimalMesh = null;
    }

    // อัพเดตป้ายคำใบ้/การ์ดการเรียนรู้
    $('fact-board').style.display = 'block';
    $('fact-animal-name').innerText = `${currentAnimal.nameTH} (${currentAnimal.nameEN})`;
    
    // สุ่มคำใบ้วิทยาศาสตร์รอบนี้มา 1 คำใบ้
    const facts = currentAnimal.facts;
    $('fact-text').innerText = facts[Math.floor(Math.random() * facts.length)];

    // ประกอบร่างโมเดล 3D
    if (hasTHREE && scene) {
        currentAnimalMesh = buildVoxelAnimal(currentAnimal.id);
        currentAnimalMesh.position.set(0, 2.35, 0); // วางบนแท่นกลางฟ้า
        scene.add(currentAnimalMesh);
    }
}

// ฟังก์ชันถูกเรียกเมื่อทำการคัดเลือก (ปุ่มคลิก หรือ RAYCASTING)
function selectHabitat(habitatId) {
    if (inputLocked || isGameOver || !started) return;
    inputLocked = true;

    const isCorrect = currentAnimal.habitat === habitatId;
    const screenPos = currentAnimalMesh ? getScreenPosition(currentAnimalMesh) : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    if (isCorrect) {
        // ถูกต้อง!
        combo++;
        classifiedCount++;
        const basePoints = CFG.POINTS_CORRECT;
        const gain = basePoints * getComboMultiplier();
        setScore(score + gain);
        updateComboBadge();

        burst(screenPos.x, screenPos.y, currentAnimal.color || 0xffd700);
        scorePop(screenPos.x, screenPos.y, `+${gain}`, currentAnimal.color || 0xffd700);

        KAMPAI.sound.correct();
        KAMPAI.sound.fxFlash(true);

        // ไต่เวล
        const nextLvl = 1 + Math.floor(score / CFG.LEVEL_EVERY_SCORE);
        if (nextLvl > level) {
            level = nextLvl;
            $('level-badge').innerText = 'เลเวล ' + level;
            toast(`⚡ อัปเลเวล ${level}!`);
        }

        // แอนิเมชันสไลด์สัตว์ลงไปหาถิ่นที่อยู่บนเกาะ 3D
        animateAnimalToHabitat(habitatId, true);

        // รายงานคะแนนสู่ Match (หากเป็นโหมดออนไลน์)
        if (mode === 'online' && vs) {
            vs.report(score, { correct: classifiedCount });
        }
    } else {
        // ผิด!
        combo = 0;
        updateComboBadge();
        shakeScreen();

        KAMPAI.sound.wrong();
        KAMPAI.sound.fxFlash(false);

        scorePop(screenPos.x, screenPos.y, '💥', '#ef4444');

        if (mode === 'adventure') {
            setLives(lives - 1);
        } else {
            // โหมดเวลาหักคะแนนแทน
            setScore(score - CFG.POINTS_INCORRECT_PENALTY);
        }

        // แอนิเมชันตกหล่นหายลอยลงทะเล
        animateAnimalToHabitat(habitatId, false);
    }
}

// แอนิเมชันสไลด์/ร่วงหล่นของสัตว์
let animationProgress = 0;
let animationActive = false;
let animStartPos = new THREE.Vector3();
let animEndPos = new THREE.Vector3();
let animationSuccess = true;

function animateAnimalToHabitat(habitatId, success) {
    if (!hasTHREE || !currentAnimalMesh) {
        // หากไม่มี 3D (JSDOM) ให้รันแบบไม่มีกราฟิกข้าม
        setTimeout(spawnAnimal, CFG.NEXT_SPAWN_DELAY_MS);
        return;
    }

    animationSuccess = success;
    animStartPos.copy(currentAnimalMesh.position);

    if (success) {
        // พิกัดศูนย์กลางของแต่ละควอดรันต์ 2x2
        // Forest = T-L (-2.7, -2.7), Desert = T-R (2.7, -2.7)
        // Arctic = B-L (-2.7, 2.7), Ocean = B-R (2.7, 2.7)
        // ตำแหน่งดินบนผิวเกาะเฉลี่ย y ~ 0.4
        const platSize = 5.2;
        const gap = 0.15;
        const dist = platSize / 2 + gap;

        // สังเกตว่าพิกัดเหล่านี้ต้องดึงจากแกนสอดคล้องกับพิกัดที่เกาะลอยน้ำจัดไว้
        let tx = 0, tz = 0;
        if (habitatId === 'forest') { tx = -dist; tz = -dist; }
        else if (habitatId === 'desert') { tx = dist; tz = -dist; }
        else if (habitatId === 'arctic') { tx = -dist; tz = dist; }
        else if (habitatId === 'ocean') { tx = dist; tz = dist; }

        // สุ่มเลี่ยงต้นไม้/กระบองเพชรหน่อย
        tx += (Math.random() - 0.5) * 1.5;
        tz += (Math.random() - 0.5) * 1.5;

        animEndPos.set(tx, 0.45, tz);
    } else {
        // ผิด: ร่วงหลุดขอบเกาะลงไปในทะเล (ดิ่งพสุธา)
        animEndPos.set(animStartPos.x + (Math.random() - 0.5) * 5, -8, animStartPos.z + (Math.random() - 0.5) * 5);
    }

    animationProgress = 0;
    animationActive = true;
}

function clearPlacedAnimals() {
    if (currentAnimalMesh && scene) {
        scene.remove(currentAnimalMesh);
        currentAnimalMesh = null;
    }
    if (k3d) {
        k3d.clearGroup();
    }
}

// ── เริ่มต้นรอบการเล่น ──
function startGame(m) {
    if (started && m !== 'online' && mode !== 'online') return;
    mode = m || 'adventure';
    started = true;
    isGameOver = false;

    score = 0;
    lives = CFG.LIVES;
    level = 1;
    combo = 0;
    classifiedCount = 0;
    inputLocked = false;
    rngGenerator = Math.random;

    setScore(0);
    updateComboBadge();
    $('level-badge').innerText = 'เลเวล 1';
    $('blocker').style.display = 'none';
    $('gameover-screen').style.display = 'none';

    // วัยชีวิตและนาฬิกา
    if (mode === 'adventure') {
        $('life-container').style.display = 'block';
        setLives(CFG.LIVES);
        $('timer-container').style.display = 'none';
    } else if (mode === 'time') {
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'block';
        timeLeft = CFG.TIME_SECONDS;
        $('timer-value').innerText = timeLeft;
        if (timerIntervalId) clearInterval(timerIntervalId);
        timerIntervalId = setInterval(tickTimer, 1000);
    } else {
        // online
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'none';
    }

    // ล้างโมเดลสัตว์ตัวเก่าที่อาจตกค้างรอบก่อนบนเกาะ
    clearPlacedAnimals();

    KAMPAI.sound.unlock();
    KAMPAI.sound.bgmStart();

    // บูทเกมสามมิติ (ถ้ายังไม่เคยวาด)
    if (!renderer) {
        init3D();
    }

    spawnAnimal();
}

function startRound(rng, player) {
    // ฟังก์ชันนี้ถูกเชื่อมกับ KampaiVersus สำหรับโหมด 2 ผู้เล่น / ออนไลน์
    rngGenerator = rng || Math.random;
    score = 0;
    classifiedCount = 0;
    inputLocked = false;
    started = true;
    isGameOver = false;
    roundActive = true; // เปิดใช้งานรอบ Versus

    if (player !== null) {
        mode = 'versus'; // โหมดแข่งบนเครื่องเดียวกัน
    } else {
        mode = 'online'; // โหมดออนไลน์แข่งกับห้องเรียน
    }

    $('blocker').style.display = 'none';
    $('gameover-screen').style.display = 'none';
    $('life-container').style.display = 'none';
    $('timer-container').style.display = 'none';
    setScore(0);
    updateComboBadge();
    $('level-badge').innerText = 'แข่งแยกสัตว์';

    clearPlacedAnimals();

    if (!renderer) {
        init3D();
    }

    spawnAnimal();
}

function tickTimer() {
    timeLeft--;
    $('timer-value').innerText = timeLeft;
    $('timer-container').classList.toggle('low', timeLeft <= 10);
    if (timeLeft <= 0) {
        endGame();
    }
}

// สิ้นสุดเกม
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    inputLocked = true;

    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }

    KAMPAI.sound.bgmStop();
    KAMPAI.sound.gameOver();

    // ตรวจสอบว่าโหมดแข่ง P2 หรือออนไลน์ จัดการบันทึกต่อเองหรือไม่
    if (vs.finish(score, { correct: classifiedCount })) {
        return; // Versus รับไปทำต่อ
    }

    // โหมดเดี่ยวปกติยิง SDK
    const stars = CFG.STAR_THRESHOLDS.filter(t => score >= t).length;
    KAMPAI.submitScore(score, {
        mode: 'normal',
        stars: stars,
        correct: classifiedCount,
        level: level
    });

    $('go-stars').innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('final-score').innerText = score.toLocaleString();
    $('go-summary').innerText = `พาเพื่อนสัตว์กลับบ้านได้ ${classifiedCount} ตัว · ทำเลเวลได้ถึงเลเวล ${level} ในโหมด ${mode === 'time' ? 'แข่งเวลา' : 'ผจญภัย'}`;
    $('gameover-screen').style.display = 'flex';

    renderLeaderboard('score-list-gameover');
}

// ไม่ต้องรันลูปอนิเมชันแบบแมนนวล ลูปถูกจัดการโดย Kampai3D.create

