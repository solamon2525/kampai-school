/* data.js — โจทย์แต่ละรอบ · window.GAME_DATA
   rounds: ประเภทโจทย์ (บวก ลบ คูณ หาร มากกว่า น้อยกว่า)
   buildRoundProblem / pickSpawnNumber — สร้างโจทย์และตัวเลขที่ตก
   แก้เนื้อหาที่นี่ ไม่ต้องแตะ game.js */
window.GAME_DATA = {
    rounds: [
        { type: 'add', emoji: '➕', label: 'บวก',      hint: 'รับผลลัพธ์ที่ถูกต้อง' },
        { type: 'sub', emoji: '➖', label: 'ลบ',      hint: 'รับผลลัพธ์ที่ถูกต้อง' },
        { type: 'mul', emoji: '✖️', label: 'คูณ',      hint: 'รับผลลัพธ์ที่ถูกต้อง' },
        { type: 'div', emoji: '➗', label: 'หาร',      hint: 'รับผลลัพธ์ที่ถูกต้อง (หารลงตัว)' },
        { type: 'gt',  emoji: '▲',  label: 'มากกว่า', hint: 'รับเลขที่มากกว่าค่าเป้า' },
        { type: 'lt',  emoji: '▼',  label: 'น้อยกว่า', hint: 'รับเลขที่น้อยกว่าค่าเป้า' }
    ],

    numbers: (function () {
        var arr = [];
        for (var i = 1; i <= 100; i++) arr.push(i);
        return arr;
    })(),

    NUMBER_COLORS: [
        ['#ff6b81', '#c0392b'],
        ['#4bd0ff', '#1a73b8'],
        ['#ffd54b', '#e0a800'],
        ['#7de88a', '#2e9e4a'],
        ['#c58bff', '#7c3fbf'],
        ['#ff9f5b', '#d9701c'],
        ['#5bd6c9', '#1b9c8c'],
        ['#ff8ac1', '#d94f92']
    ],

    buildRoundProblem: function (roundCFG, rng) {
        var r = rng || Math.random;
        function rnd(min, max) {
            return min + Math.floor(r() * (max - min + 1));
        }

        if (roundCFG.type === 'add') {
            var a = rnd(2, 18);
            var b = rnd(2, 18);
            var sum = a + b;
            return {
                type: 'add',
                answer: sum,
                label: a + ' + ' + b + ' = ?',
                hint: 'รับ ' + sum,
                check: function (n) { return n === sum; }
            };
        }

        if (roundCFG.type === 'sub') {
            var minuend = rnd(10, 40);
            var subtrahend = rnd(2, minuend - 1);
            var diff = minuend - subtrahend;
            return {
                type: 'sub',
                answer: diff,
                label: minuend + ' − ' + subtrahend + ' = ?',
                hint: 'รับ ' + diff,
                check: function (n) { return n === diff; }
            };
        }

        if (roundCFG.type === 'mul') {
            var x = rnd(2, 12);
            var y = rnd(2, 12);
            var prod = x * y;
            return {
                type: 'mul',
                answer: prod,
                label: x + ' × ' + y + ' = ?',
                hint: 'รับ ' + prod,
                check: function (n) { return n === prod; }
            };
        }

        if (roundCFG.type === 'div') {
            var divisor = rnd(2, 12);
            var quotient = rnd(2, 12);
            var dividend = divisor * quotient;
            return {
                type: 'div',
                answer: quotient,
                label: dividend + ' ÷ ' + divisor + ' = ?',
                hint: 'รับ ' + quotient,
                check: function (n) { return n === quotient; }
            };
        }

        if (roundCFG.type === 'gt') {
            var gtVal = rnd(15, 70);
            return {
                type: 'gt',
                answer: null,
                label: 'รับเลข > ' + gtVal,
                hint: 'มากกว่า ' + gtVal + ' เท่านั้น',
                check: function (n) { return n > gtVal; }
            };
        }

        if (roundCFG.type === 'lt') {
            var ltVal = rnd(30, 85);
            return {
                type: 'lt',
                answer: null,
                label: 'รับเลข < ' + ltVal,
                hint: 'น้อยกว่า ' + ltVal + ' เท่านั้น',
                check: function (n) { return n < ltVal; }
            };
        }

        return {
            type: 'gt',
            answer: null,
            label: roundCFG.label || '?',
            hint: roundCFG.hint || '',
            check: function () { return false; }
        };
    },

    pickSpawnNumber: function (problem, rng) {
        var r = rng || Math.random;
        var pool = window.GAME_DATA.numbers;

        function rnd(min, max) {
            return min + Math.floor(r() * (max - min + 1));
        }

        if (problem.type === 'gt' || problem.type === 'lt') {
            return pool[Math.floor(r() * pool.length)];
        }

        if (r() < 0.42) return problem.answer;

        var wrong = problem.answer;
        var tries = 0;
        while (wrong === problem.answer && tries < 30) {
            var delta = rnd(1, 12) * (r() < 0.5 ? -1 : 1);
            wrong = problem.answer + delta;
            if (wrong < 1) wrong = problem.answer + rnd(1, 15);
            if (wrong > 99) wrong = Math.max(1, problem.answer - rnd(1, 15));
            tries++;
        }
        if (wrong === problem.answer) wrong = problem.answer + 1;
        return wrong;
    }
};
