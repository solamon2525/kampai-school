/**
 * GAME DATA — Farm Adventure
 * คลังโจทย์สุ่มใหม่ทุกครั้ง — 5 ด่าน, ธีมฟาร์ม
 */
window.GAME_DATA = {
    // ตัวละครสัตว์เลี้ยง (ปลดล็อกทีละตัวเมื่อผ่านด่าน)
    pets: [
        { name: 'ลูกหมู', emoji: '🐷', unlockLevel: 0 },
        { name: 'วัวน้อย', emoji: '🐮', unlockLevel: 1 },
        { name: 'กระต่าย', emoji: '🐰', unlockLevel: 2 },
        { name: 'ไก่น้อย', emoji: '🐔', unlockLevel: 3 },
        { name: 'ม้าน้อย', emoji: '🐴', unlockLevel: 4 },
    ],

    // ผลผลิตฟาร์ม (ใช้ในโจทย์)
    farmItems: ['🥕 แครอท','🌽 ข้าวโพด','🍅 มะเขือเทศ','🥒 แตงกวา','🍆 มะเขือม่วง','🌶️ พริก','🥬 ผักกาด','🍉 แตงโม','🍈 แคนตาลูป','🥭 มะม่วง','🍌 กล้วย','🍎 แอปเปิ้ล','🍊 ส้ม','🍇 องุ่น','🍓 สตรอว์เบอร์รี'],

    farmObjects: ['🥕','🌽','🍅','🥒','🍆','🌶️','🥬','🍉','🥭','🍌','🌻','🌿','🪴','🌾','🎃'],

    levels: [
        // ═══ ด่าน 1: สวนผักแสนสนุก — วัดความยาวของแปลงผัก ═══
        {
            name: 'ด่าน 1: สวนผักแสนสนุก',
            subtitle: 'วัดความยาวของแปลงผัก',
            emoji: '🥬',
            bg: 'linear-gradient(180deg, #a8e063 0%, #56ab2f 100%)',
            reward: '🐮',
            generate: function () {
                const units = ['cm', 'mm'];
                const u = units[Math.floor(Math.random() * units.length)];
                let len, q;
                const veggies = ['แปลงผักกาด','แปลงแครอท','แปลงข้าวโพด','กระถางต้นมะเขือ','แปลงพริก','แปลงแตงกวา','ลังผลไม้','คอกสัตว์'];
                const veg = veggies[Math.floor(Math.random() * veggies.length)];

                if (u === 'cm') {
                    len = Math.floor(Math.random() * 18) + 3;
                    q = veg + ' ยาวกี่เซนติเมตร?';
                } else {
                    len = (Math.floor(Math.random() * 15) + 2) * 5;
                    q = veg + ' ยาวกี่มิลลิเมตร?';
                }

                var d1 = Math.floor(Math.random() * 3) + 1;
                var d2 = Math.floor(Math.random() * 3) + 2;
                var d3 = Math.floor(Math.random() * 5) + 3;
                var wrong1 = Math.max(1, len + (Math.random() < 0.5 ? d1 : -d1));
                var wrong2 = Math.max(1, len + (Math.random() < 0.5 ? d2 : -d2));
                var wrong3 = Math.max(1, len + (Math.random() < 0.5 ? d3 : -d3));
                // ensure no duplicates
                while (wrong1 === len) wrong1 = len + d1;
                while (wrong2 === len || wrong2 === wrong1) wrong2 = len + d2 + 1;
                while (wrong3 === len || wrong3 === wrong1 || wrong3 === wrong2) wrong3 = len + d3 + 2;

                var suffix = u === 'cm' ? ' cm' : ' mm';
                var choices = [len + suffix, wrong1 + suffix, wrong2 + suffix, wrong3 + suffix];
                return { q: q, choices: choices, answer: 0, visual: { type: 'ruler', length: len, unit: u } };
            }
        },

        // ═══ ด่าน 2: โรงนาแห่งตัวเลข — เปรียบเทียบความยาว ═══
        {
            name: 'ด่าน 2: โรงนาแห่งตัวเลข',
            subtitle: 'เปรียบเทียบความยาว มากกว่า น้อยกว่า เท่ากับ',
            emoji: '🏠',
            bg: 'linear-gradient(180deg, #f7971e 0%, #ffd200 100%)',
            reward: '🐰',
            generate: function () {
                var templates = [
                    // เปรียบเทียบหน่วยเดียวกัน
                    function () {
                        var us = [
                            { unit: 'cm', max: 100 },
                            { unit: 'mm', max: 500 },
                            { unit: 'm', max: 50 },
                            { unit: 'km', max: 20 }
                        ];
                        var pick = us[Math.floor(Math.random() * us.length)];
                        var a = Math.floor(Math.random() * pick.max) + 1;
                        var b = Math.floor(Math.random() * pick.max) + 1;
                        // 80% ให้ต่างกัน, 20% เท่ากัน
                        if (Math.random() < 0.2) b = a;
                        else while (b === a) b = Math.floor(Math.random() * pick.max) + 1;
                        var symbol = a > b ? '>' : (a < b ? '<' : '=');
                        var q = a + ' ' + pick.unit + '  ▢  ' + b + ' ' + pick.unit;
                        return { q: q, choices: ['>', '<', '='], answer: ['>', '<', '='].indexOf(symbol), visual: { type: 'compare', a: a, b: b, unit: pick.unit, labelA: a + ' ' + pick.unit, labelB: b + ' ' + pick.unit } };
                    },
                    // เปรียบเทียบต่างหน่วย
                    function () {
                        var pairs = [
                            { from: 'cm', to: 'mm', factor: 10, maxFrom: 15 },
                            { from: 'm', to: 'cm', factor: 100, maxFrom: 5 },
                            { from: 'km', to: 'm', factor: 1000, maxFrom: 3 }
                        ];
                        var p = pairs[Math.floor(Math.random() * pairs.length)];
                        var a = Math.floor(Math.random() * p.maxFrom) + 1;
                        var bConverted = a * p.factor;
                        var offsets = [-2, -1, 0, 1, 2];
                        var offset = offsets[Math.floor(Math.random() * offsets.length)];
                        var b = bConverted + offset;
                        if (b < 1) b = bConverted + 1;
                        var aReal = a * p.factor;
                        var symbol = aReal > b ? '>' : (aReal < b ? '<' : '=');
                        var q = a + ' ' + p.from + '  ▢  ' + b + ' ' + p.to;
                        return { q: q, choices: ['>', '<', '='], answer: ['>', '<', '='].indexOf(symbol), visual: { type: 'compare-cross', a: a, aUnit: p.from, b: b, bUnit: p.to } };
                    }
                ];
                return templates[Math.floor(Math.random() * templates.length)]();
            }
        },

        // ═══ ด่าน 3: ทุ่งดอกไม้มหัศจรรย์ — แปลงหน่วย mm cm m km ═══
        {
            name: 'ด่าน 3: ทุ่งดอกไม้มหัศจรรย์',
            subtitle: 'แปลงหน่วย mm cm m km',
            emoji: '🌸',
            bg: 'linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
            reward: '🐔',
            generate: function () {
                var conversions = [
                    { from: 'cm', to: 'mm', factor: 10 },
                    { from: 'mm', to: 'cm', factor: 0.1 },
                    { from: 'm', to: 'cm', factor: 100 },
                    { from: 'cm', to: 'm', factor: 0.01 },
                    { from: 'km', to: 'm', factor: 1000 },
                    { from: 'm', to: 'km', factor: 0.001 },
                    { from: 'km', to: 'cm', factor: 100000 },
                    { from: 'm', to: 'mm', factor: 1000 },
                    { from: 'mm', to: 'm', factor: 0.001 },
                ];
                var c = conversions[Math.floor(Math.random() * conversions.length)];
                var val;
                if (c.from === 'km') val = Math.floor(Math.random() * 8) + 1;
                else if (c.from === 'm' && c.to === 'km') val = (Math.floor(Math.random() * 8) + 1) * 1000;
                else if (c.from === 'm' && c.to === 'mm') val = Math.floor(Math.random() * 5) + 1;
                else if (c.from === 'm') val = Math.floor(Math.random() * 15) + 1;
                else if (c.from === 'cm' && c.to === 'm') val = (Math.floor(Math.random() * 8) + 1) * 100;
                else if (c.from === 'cm') val = Math.floor(Math.random() * 25) + 1;
                else if (c.from === 'mm' && c.to === 'cm') val = (Math.floor(Math.random() * 15) + 1) * 10;
                else if (c.from === 'mm' && c.to === 'm') val = (Math.floor(Math.random() * 5) + 1) * 1000;
                else val = (Math.floor(Math.random() * 15) + 1) * 10;

                var correct = val * c.factor;
                var fmt = function (n) {
                    if (Number.isInteger(n)) return '' + n;
                    return '' + parseFloat(n.toFixed(3));
                };
                var q = val + ' ' + c.from + ' = ? ' + c.to;
                var w1 = correct * 10;
                var w2 = correct / 10; if (w2 === 0) w2 = 1;
                var w3 = correct * 100;
                if (w3 === correct) w3 = correct + 10;
                var choices = [fmt(correct) + ' ' + c.to, fmt(w1) + ' ' + c.to, fmt(Math.max(0.001, w2)) + ' ' + c.to, fmt(w3) + ' ' + c.to];
                return { q: q, choices: choices, answer: 0, visual: { type: 'convert', from: c.from, to: c.to, val: val } };
            }
        },

        // ═══ ด่าน 4: ฟาร์มผลไม้ยักษ์ — บวกและลบความยาว ═══
        {
            name: 'ด่าน 4: ฟาร์มผลไม้ยักษ์',
            subtitle: 'บวกและลบความยาว',
            emoji: '🍎',
            bg: 'linear-gradient(180deg, #43e97b 0%, #38f9d7 100%)',
            reward: '🐴',
            generate: function () {
                var ops = [
                    // บวก (หน่วยเดียวกัน)
                    function () {
                        var us = ['cm','mm','m'];
                        var u = us[Math.floor(Math.random() * us.length)];
                        var a, b;
                        if (u === 'cm') { a = Math.floor(Math.random() * 80) + 10; b = Math.floor(Math.random() * 60) + 5; }
                        else if (u === 'mm') { a = Math.floor(Math.random() * 200) + 50; b = Math.floor(Math.random() * 150) + 20; }
                        else { a = Math.floor(Math.random() * 30) + 5; b = Math.floor(Math.random() * 20) + 3; }
                        var ans = a + b;
                        return { q: a + ' ' + u + ' + ' + b + ' ' + u + ' = ?', ans: ans, u: u };
                    },
                    // ลบ (หน่วยเดียวกัน)
                    function () {
                        var us = ['cm','mm','m'];
                        var u = us[Math.floor(Math.random() * us.length)];
                        var a, b;
                        if (u === 'cm') { a = Math.floor(Math.random() * 80) + 30; b = Math.floor(Math.random() * 25) + 5; }
                        else if (u === 'mm') { a = Math.floor(Math.random() * 300) + 100; b = Math.floor(Math.random() * 90) + 10; }
                        else { a = Math.floor(Math.random() * 40) + 10; b = Math.floor(Math.random() * 8) + 1; }
                        if (a < b) { var t = a; a = b; b = t; }
                        var ans = a - b;
                        return { q: a + ' ' + u + ' - ' + b + ' ' + u + ' = ?', ans: ans, u: u };
                    },
                    // บวก (ต่างหน่วย แปลงก่อน)
                    function () {
                        var a_m = Math.floor(Math.random() * 3) + 1;
                        var b_cm = Math.floor(Math.random() * 80) + 10;
                        var ans = a_m * 100 + b_cm;
                        return { q: a_m + ' m + ' + b_cm + ' cm = ? cm', ans: ans, u: 'cm' };
                    },
                    // ลบ (ต่างหน่วย แปลงก่อน)
                    function () {
                        var a_m = Math.floor(Math.random() * 3) + 2;
                        var b_cm = Math.floor(Math.random() * 50) + 10;
                        var ans = a_m * 100 - b_cm;
                        return { q: a_m + ' m - ' + b_cm + ' cm = ? cm', ans: ans, u: 'cm' };
                    }
                ];
                var op = ops[Math.floor(Math.random() * ops.length)]();
                var correct = op.ans;
                var d1 = Math.floor(Math.random() * 15) + 1;
                var d2 = Math.floor(Math.random() * 20) + 5;
                var d3 = Math.floor(Math.random() * 30) + 10;
                var w1 = correct + d1;
                var w2 = Math.max(1, correct - d2);
                var w3 = correct + d3;
                while (w1 === correct) w1++;
                while (w2 === correct || w2 === w1) w2 = Math.max(1, correct - d2 - 1);
                while (w3 === correct || w3 === w1 || w3 === w2) w3 = correct + d3 + 5;

                var choices = [correct + ' ' + op.u, w1 + ' ' + op.u, w2 + ' ' + op.u, w3 + ' ' + op.u];
                return { q: op.q, choices: choices, answer: 0, visual: { type: 'arithmetic' } };
            }
        },

        // ═══ ด่าน 5: ภารกิจฟื้นฟูฟาร์ม — โจทย์ปัญหาประยุกต์ ═══
        {
            name: 'ด่าน 5: ภารกิจฟื้นฟูฟาร์ม',
            subtitle: 'โจทย์ปัญหาประยุกต์เกี่ยวกับความยาว',
            emoji: '🏆',
            bg: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            reward: '🎖️',
            generate: function () {
                var problems = [
                    function () {
                        var a = Math.floor(Math.random() * 30) + 10;
                        var b = Math.floor(Math.random() * 30) + 10;
                        var c = Math.floor(Math.random() * 20) + 5;
                        return { q: 'รั้วฟาร์มด้านหน้ายาว ' + a + ' m ด้านข้างยาว ' + b + ' m ด้านหลังยาว ' + c + ' m รวมรั้วทั้งหมดยาวเท่าไร?', ans: a + b + c, u: 'm' };
                    },
                    function () {
                        var total = Math.floor(Math.random() * 50) + 20;
                        var used = Math.floor(Math.random() * (total - 5)) + 5;
                        return { q: 'ชาวนามีเชือกยาว ' + total + ' m ใช้ผูกวัวไป ' + used + ' m เหลือเชือกกี่เมตร?', ans: total - used, u: 'm' };
                    },
                    function () {
                        var n = Math.floor(Math.random() * 8) + 3;
                        var each = Math.floor(Math.random() * 15) + 5;
                        return { q: 'แปลงผักมี ' + n + ' แถว แต่ละแถวยาว ' + each + ' cm ถ้าวางต่อกันจะยาวเท่าไร?', ans: n * each, u: 'cm' };
                    },
                    function () {
                        var km = Math.floor(Math.random() * 5) + 1;
                        return { q: 'จากบ้านไปฟาร์มไกล ' + km + ' km เท่ากับกี่เมตร?', ans: km * 1000, u: 'm' };
                    },
                    function () {
                        var a = Math.floor(Math.random() * 50) + 30;
                        var b = Math.floor(Math.random() * 50) + 30;
                        return { q: 'ลำธารสายแรกยาว ' + a + ' m สายที่สองยาว ' + b + ' m สายไหนยาวกว่าและยาวกว่ากี่เมตร?', ans: Math.abs(a - b), u: 'm' };
                    },
                    function () {
                        var total = (Math.floor(Math.random() * 5) + 2) * 100;
                        return { q: 'ท่อน้ำยาว ' + total + ' cm จะแปลงเป็นเมตรได้กี่เมตร?', ans: total / 100, u: 'm' };
                    },
                    function () {
                        var h1 = Math.floor(Math.random() * 30) + 120;
                        var h2 = Math.floor(Math.random() * 30) + 120;
                        return { q: 'ต้นข้าวโพดต้นแรกสูง ' + h1 + ' cm ต้นที่สองสูง ' + h2 + ' cm สูงต่างกันกี่เซนติเมตร?', ans: Math.abs(h1 - h2), u: 'cm' };
                    },
                    function () {
                        var w = Math.floor(Math.random() * 8) + 3;
                        var l = Math.floor(Math.random() * 12) + 5;
                        return { q: 'แปลงนากว้าง ' + w + ' m ยาว ' + l + ' m เส้นรอบรูปแปลงนาเท่าไร?', ans: 2 * (w + l), u: 'm' };
                    },
                    function () {
                        var m = Math.floor(Math.random() * 3) + 1;
                        var cm = Math.floor(Math.random() * 80) + 10;
                        return { q: 'เสาสูง ' + m + ' m ' + cm + ' cm เท่ากับกี่เซนติเมตร?', ans: m * 100 + cm, u: 'cm' };
                    },
                    function () {
                        var total = Math.floor(Math.random() * 200) + 100;
                        var n = Math.floor(Math.random() * 4) + 2;
                        var each = Math.floor(total / n);
                        var realTotal = each * n;
                        return { q: 'เชือกยาว ' + realTotal + ' cm แบ่งเท่า ๆ กัน ' + n + ' เส้น แต่ละเส้นยาวกี่ cm?', ans: each, u: 'cm' };
                    }
                ];
                var p = problems[Math.floor(Math.random() * problems.length)]();
                var correct = p.ans;
                var fmt = function (n) {
                    if (Number.isInteger(n)) return '' + n;
                    return '' + parseFloat(n.toFixed(2));
                };
                var d1 = Math.floor(Math.random() * 10) + 1;
                var d2 = Math.floor(Math.random() * 15) + 3;
                var d3 = Math.floor(Math.random() * 20) + 5;
                var w1 = correct + d1;
                var w2 = Math.max(1, correct - d2);
                var w3 = correct * 2;
                while (w1 === correct) w1++;
                while (w2 === correct || w2 === w1) w2 = Math.max(1, correct - d2 - 1);
                while (w3 === correct || w3 === w1 || w3 === w2) w3 = correct + d3 + 10;

                var choices = [fmt(correct) + ' ' + p.u, fmt(w1) + ' ' + p.u, fmt(w2) + ' ' + p.u, fmt(w3) + ' ' + p.u];
                return { q: p.q, choices: choices, answer: 0, visual: { type: 'word-problem' } };
            }
        }
    ]
};
