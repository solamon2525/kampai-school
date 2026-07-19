import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Starting JSDOM Automated Test Suite for Attack on Noun...');

let JSDOM;
try {
    const jsdomMod = await import('jsdom');
    JSDOM = jsdomMod.JSDOM;
} catch (e) {
    console.error('❌ Failed to load jsdom:', e.message);
    process.exit(1);
}

const REPO_ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1')), '..');
const publicPath = path.resolve(REPO_ROOT, 'public');
const htmlPath = path.resolve(publicPath, 'games/thai/attack-on-noun/index.html');
const configPath = path.resolve(publicPath, 'games/thai/attack-on-noun/config.js');
const dataPath = path.resolve(publicPath, 'games/thai/attack-on-noun/data.js');
const gamePath = path.resolve(publicPath, 'games/thai/attack-on-noun/game.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const configContent = fs.readFileSync(configPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const gameContent = fs.readFileSync(gamePath, 'utf8');

// Mock localStorage according to Workspace Rule 2
const storageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();

// Create JSDOM instance
const dom = new JSDOM(htmlContent, {
    url: 'http://localhost/games/thai/attack-on-noun/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
});

const { window } = dom;

// Stub localStorage on window
Object.defineProperty(window, 'localStorage', { value: storageMock });

// Stub Canvas & WebGL Context according to Workspace Rule 4
window.HTMLCanvasElement.prototype.getContext = function(type) {
    return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => ([]),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        strokeRect: () => {},
        measureText: () => ({ width: 100 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} })
    };
};

// Stub AudioContext
window.AudioContext = window.webkitAudioContext = class {
    constructor() { this.state = 'suspended'; }
    resume() { return Promise.resolve(); }
    createOscillator() {
        return {
            type: 'sine',
            frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {}
        };
    }
    createGain() {
        return {
            gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {}
        };
    }
};

// Mock Three.js Global object
window.THREE = {
    Scene: class { add() {} remove() {} traverse(cb) {} },
    PerspectiveCamera: class { constructor() { this.aspect = 1; this.position = { set() {}, copy() {} }; } updateProjectionMatrix() {} setFov() {} },
    WebGLRenderer: class { constructor() { this.shadowMap = {}; this.domElement = window.document.createElement('canvas'); } setSize() {} setPixelRatio() {} render() {} },
    Color: class {},
    Fog: class {},
    AmbientLight: class {},
    DirectionalLight: class { constructor() { this.position = { set() {} }; this.shadow = { mapSize: {}, camera: {} }; } },
    Mesh: class { constructor() { this.position = new window.THREE.Vector3(); this.rotation = { set() {} }; this.scale = { set() {}, setScalar() {} }; this.userData = {}; this.geometry = { translate() {} }; } add() {} remove() {} },
    Group: class { constructor() { this.position = new window.THREE.Vector3(); this.rotation = { set() {} }; this.scale = { set() {}, setScalar() {} }; this.userData = {}; this.children = []; } add() {} remove() {} },
    PlaneGeometry: class {},
    BoxGeometry: class { translate() {} },
    RingGeometry: class {},
    SphereGeometry: class {},
    ConeGeometry: class {},
    MeshStandardMaterial: class {},
    MeshBasicMaterial: class {},
    SpriteMaterial: class {},
    Sprite: class { constructor() { this.position = { set() {} }; this.scale = { set() {} }; this.material = {}; } },
    CanvasTexture: class {},
    Vector3: class { constructor() { this.x = 0; this.y = 0; this.z = 0; } set() { return this; } copy(v) { if (v) { this.x = v.x; this.y = v.y; this.z = v.z; } return this; } clone() { return new window.THREE.Vector3().copy(this); } add(v) { if (v) { this.x += v.x; this.y += v.y; this.z += v.z; } return this; } sub(v) { if (v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; } return this; } subVectors(a, b) { if (a && b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; } return this; } normalize() { return this; } multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; } distanceTo() { return 10; } },
    Vector2: class { constructor() { this.x = 0; this.y = 0; } distanceTo() { return 10; } },
    Raycaster: class { set() {} intersectObjects() { return []; } },
    MathUtils: { lerp: (a, b, t) => a + (b - a) * t, generateUUID: () => 'uuid-' + Math.random() }
};

// Catch errors during execution
const errors = [];
window.onerror = (msg, url, line, col, err) => {
    errors.push({ msg, line, col, stack: err ? err.stack : null });
};

try {
    console.log('Loading scripts into JSDOM...');
    window.eval(configContent);
    window.eval(dataContent);
    
    // Evaluate KAMPAI SDK stub
    window.KAMPAI = {
        isEmbed: false, ready: true, student: { name: 'นักเรียนทดสอบ', displayName: 'นักเรียนทดสอบ' }, stats: { personalBest: 500 }, leaderboard: [], classmates: [],
        setSlug: function() { return this; },
        onReady: (cb) => cb(window.KAMPAI),
        submitScore: (sc) => { console.log('SDK submitScore:', sc); return true; },
        goHome: () => {},
        sound: {
            correct: () => {}, wrong: () => {}, timeUp: () => {}, gameOver: () => {},
            bgmStart: () => {}, bgmStop: () => {}, unlock: () => {}, speak: () => {}, mountToggles: () => {}
        }
    };
    
    window.eval(gameContent);
    console.log('✅ Scripts loaded without runtime crashes!');
    
    // Simulate UI Clicks
    const { document } = window;
    
    console.log('Testing Campaign Button click...');
    const campaignBtn = document.getElementById('campaign-btn');
    if (campaignBtn) {
        campaignBtn.click();
        console.log('Campaign screen display:', document.getElementById('campaign-screen')?.style.display);
    } else {
        errors.push({ msg: '#campaign-btn not found in DOM!' });
    }
    
    console.log('Testing Stage Card click...');
    const stageCard = document.querySelector('.stage-card');
    if (stageCard) {
        stageCard.click();
        console.log('Dialogue overlay display:', document.getElementById('dialogue-overlay')?.style.display);
        const dialogueNext = document.getElementById('dialogue-next');
        if (dialogueNext) {
            dialogueNext.click();
            console.log('Dialogue next clicked');
        }
    }
    
    console.log('Testing Analytics Button click...');
    const analyticsBtn = document.getElementById('analytics-btn');
    if (analyticsBtn) {
        analyticsBtn.click();
        console.log('Analytics screen display:', document.getElementById('analytics-screen')?.style.display);
    }
    
    console.log('Testing Skins Button click...');
    const skinsBtn = document.getElementById('skins-btn');
    if (skinsBtn) {
        skinsBtn.click();
        console.log('Skins screen display:', document.getElementById('skins-screen')?.style.display);
    }
    
    console.log('Testing Start Game button click...');
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.click();
        console.log('Game started successfully!');
    } else {
        errors.push({ msg: '#startBtn not found in DOM!' });
    }
    
} catch (e) {
    errors.push({ msg: e.message, stack: e.stack });
}

if (errors.length > 0) {
    console.error('❌ JSDOM Test Failures Found:', errors);
    process.exit(1);
} else {
    console.log('🎉 ALL JSDOM AUTOMATED TESTS PASSED SUCCESSFULLY!');
}
