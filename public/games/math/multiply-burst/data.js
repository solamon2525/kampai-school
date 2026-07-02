/* data.js — ชุดสีลูกโป่งและข้อความเสียงตอบถูก */
window.GAME_DATA = {
    CORRECT_PHRASES: [
        'ถูกต้อง!',
        'เก่งมาก!',
        'เยี่ยมเลย!',
        'ได้เลย!',
        'สุดยอด!'
    ],

    OP_MODES: {
        add: { label: 'บวก', symbol: '+', icon: '➕' },
        sub: { label: 'ลบ', symbol: '−', icon: '➖' },
        mul: { label: 'คูณ', symbol: '×', icon: '✖️' },
        div: { label: 'หาร', symbol: '÷', icon: '➗' },
        mixed: { label: 'ผสม', symbol: '?', icon: '🔀' }
    },

    // สีลูกโป่ง — สลับจาก deck (ไม่ผูกกับตัวเลข) เพื่อไม่ให้ผู้เล่นจำสีแทนคำตอบ
    BALLOON_COLORS: [
        ['#ff6b81', '#c0392b'],
        ['#4bd0ff', '#1a73b8'],
        ['#ffd54b', '#e0a800'],
        ['#7de88a', '#2e9e4a'],
        ['#c58bff', '#7c3fbf'],
        ['#ff9f5b', '#d9701c'],
        ['#5bd6c9', '#1b9c8c'],
        ['#ff8ac1', '#d94f92']
    ]
};
