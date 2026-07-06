/* data.js — ข้อมูลคณิตศาสตร์และเศษส่วนสำหรับเกม "Fraction Tank" */
window.GAME_DATA = {
  commonDenominators: [2, 3, 4, 5, 6, 8, 10, 12],
  difficultyLevels: [
    { level: 1, op: '>', minD: 2, maxD: 5, planeCount: 3 },
    { level: 2, op: '<', minD: 2, maxD: 6, planeCount: 3 },
    { level: 3, op: '>', minD: 3, maxD: 8, planeCount: 4 },
    { level: 4, op: '<', minD: 3, maxD: 10, planeCount: 4 },
    { level: 5, op: '>', minD: 4, maxD: 12, planeCount: 5 }
  ]
};
