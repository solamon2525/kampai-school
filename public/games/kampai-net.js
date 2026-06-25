/*!
 * kampai-net.js — ชั้น "netcode" สำหรับเกมออนไลน์ kampai-school
 *
 * แก้ปัญหา "กระตุก" ของเกมที่ sync ตำแหน่งเรียลไทม์ ด้วยเทคนิคมาตรฐานเกมเน็ตเวิร์ก:
 *   1) network tick แยกจาก render — ส่ง state คงที่ tickHz (เช่น 20Hz) ไม่ผูกกับ 60fps
 *   2) snapshot interpolation — ฝั่งรับ "เรนเดอร์ย้อนหลัง" interpDelay ms แล้ว lerp ระหว่าง 2 snapshot
 *      → คู่แข่งขยับลื่นแม้แพ็กเก็ตมาเป็นช่วง ๆ (แทนการ set ตำแหน่งดิบที่กระโดดเป็นก้อน)
 *   3) timebase = เวลา "ตอนรับ" ของเครื่องเรา (perf.now) → ไม่ต้อง sync นาฬิกาข้ามเครื่อง (ไม่มี clock skew)
 *
 * transport-agnostic: ไม่ยึดห้อง/บรอดแคสต์เอง — ใครก็ได้ (เกม หรือ KampaiMatch) เป็นเจ้าของห้อง
 * แล้วป้อน event เข้ามาผ่าน net.receive() · net จะส่ง state ออกผ่าน opts.send (default = KAMPAI.online.send)
 *
 * ใช้ (peer-broadcast — แต่ละเครื่อง broadcast ตัวเอง):
 *   <script src="/games/kampai-sdk.js"></script>
 *   <script src="/games/kampai-net.js"></script>
 *   const net = KampaiNet.create({ tickHz: 20, interpDelay: 100, fields: ['x','y'], angleFields: ['angle'] });
 *   KAMPAI.online.join(room, { onPresence, onEvent: (ev,data,from) => {
 *       if (net.receive(ev, data, from)) return;   // net กิน net-state แล้ว
 *       // ...discrete events อื่น ๆ
 *   }});
 *   net.start();
 *   // ทุกเฟรม:  net.localState({ x: me.x, y: me.y, angle: me.a });   // ตั้ง state เรา (net sample ส่งเองที่ tickHz)
 *   // ตอนวาดคู่แข่ง:  const s = net.view(peerId);   // {x,y,angle} interpolated (ลื่น) หรือ null
 *
 * เอกสาร: GAME.md (Online Multiplayer Framework → Netcode)
 */
(function () {
  'use strict';

  function perfNow() { return (window.performance && performance.now()) || Date.now(); }

  function create(opts) {
    opts = opts || {};
    var tickHz = opts.tickHz || 20;                                   // อัตราส่ง state (Hz)
    var interpDelay = opts.interpDelay != null ? opts.interpDelay : 100; // เรนเดอร์ย้อนหลังกี่ ms
    var fields = opts.fields || ['x', 'y'];                           // ฟิลด์ตัวเลขที่ lerp เชิงเส้น
    var angleFields = opts.angleFields || [];                         // ฟิลด์มุม (lerp ทางสั้น, องศา 0..360)
    var precision = opts.precision != null ? opts.precision : 2;      // ปัดทศนิยมก่อนส่ง (ลด payload)
    var evName = opts.event || 'net';                                 // ชื่อ event ที่ใช้ broadcast state
    var send = opts.send || function (payload) {
      if (window.KAMPAI && window.KAMPAI.online) window.KAMPAI.online.send(evName, payload);
    };
    var holdMs = interpDelay + 1000;     // เก็บ snapshot ย้อนหลังไว้เท่านี้ (เผื่อ interpolate)
    var pow = Math.pow(10, precision);

    var buffers = {};    // id -> [{ t:arrivalTime, s:state }]  (เรียงตามเวลารับ = เรียงโดยธรรมชาติ)
    var localObj = null; // state ล่าสุดของผู้เล่นเรา
    var timer = 0;

    function roundN(v) { return Math.round(v * pow) / pow; }

    function compact(o) {
      var out = {};
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) {
        var v = o[k];
        out[k] = (typeof v === 'number') ? roundN(v) : v;
      }
      return out;
    }

    function tick() { if (localObj) send(compact(localObj)); }

    // lerp มุมแบบทางสั้น (องศา) — กันหมุนรอบโลกตอนข้าม 359°→0°
    function lerpAngle(a, b, f) {
      var d = (((b - a) % 360) + 540) % 360 - 180;
      return a + d * f;
    }

    function lerpState(a, b, f) {
      var out = {};
      for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k]; // ฟิลด์ที่ไม่ interp → เอาจาก snapshot ใหม่กว่า
      for (var i = 0; i < fields.length; i++) {
        var kf = fields[i];
        if (typeof a[kf] === 'number' && typeof b[kf] === 'number') out[kf] = a[kf] + (b[kf] - a[kf]) * f;
      }
      for (var j = 0; j < angleFields.length; j++) {
        var ka = angleFields[j];
        if (typeof a[ka] === 'number' && typeof b[ka] === 'number') out[ka] = lerpAngle(a[ka], b[ka], f);
      }
      return out;
    }

    function trim(buf, nowT) {
      var cut = nowT - holdMs;
      while (buf.length > 2 && buf[0].t < cut) buf.shift();
    }

    return {
      tickHz: tickHz,
      interpDelay: interpDelay,

      /** ตั้ง state ของผู้เล่นเรา (เรียกทุกเฟรมหรือเมื่อเปลี่ยน) — net จะ sample ส่งเองที่ tickHz */
      localState: function (o) { localObj = o; return this; },

      /** ป้อน event ที่ได้รับเข้า buffer. คืน true ถ้าเป็น net-state (เกมไม่ต้องจัดการ event นี้ต่อ) */
      receive: function (ev, data, fromKey) {
        if (ev !== evName || !fromKey || !data) return false;
        var buf = buffers[fromKey] || (buffers[fromKey] = []);
        var t = perfNow();
        buf.push({ t: t, s: data });
        trim(buf, t);
        return true;
      },

      /** อ่าน state คู่แข่งแบบ interpolated (ลื่น) ที่เวลา now-interpDelay — คืน object หรือ null */
      view: function (id) {
        var buf = buffers[id];
        if (!buf || !buf.length) return null;
        var renderT = perfNow() - interpDelay;
        if (renderT <= buf[0].t) return buf[0].s;            // ยังมีประวัติไม่พอ → ค้างที่ snapshot เก่าสุด
        for (var i = buf.length - 1; i >= 0; i--) {
          if (buf[i].t <= renderT) {
            var a = buf[i], b = buf[i + 1];
            if (!b) return a.s;                              // แพ็กเก็ตขาด (starved) → ค้างที่ snapshot ใหม่สุด
            var span = b.t - a.t;
            var f = span > 0 ? (renderT - a.t) / span : 0;
            return lerpState(a.s, b.s, f);
          }
        }
        return buf[buf.length - 1].s;
      },

      /** ค่าดิบล่าสุดของ peer (ไม่ interpolate) — ใช้กับฟิลด์ที่ต้องการค่าจริงทันที เช่น score */
      latest: function (id) { var b = buffers[id]; return (b && b.length) ? b[b.length - 1].s : null; },

      /** ราย id ของ peer ที่มี buffer */
      peers: function () { return Object.keys(buffers); },

      /** ลบ peer (เรียกตอน presence แจ้งว่าออกห้อง) */
      dropPeer: function (id) { delete buffers[id]; return this; },

      /** sync buffer กับรายชื่อ peer ปัจจุบัน (ลบคนที่ออกไปแล้ว) */
      syncPeers: function (ids) {
        var keep = {}; (ids || []).forEach(function (id) { keep[id] = 1; });
        Object.keys(buffers).forEach(function (id) { if (!keep[id]) delete buffers[id]; });
        return this;
      },

      /** เริ่ม network tick (ส่ง state ที่ tickHz) */
      start: function () { if (!timer) timer = setInterval(tick, Math.max(20, Math.round(1000 / tickHz))); return this; },

      /** หยุด tick + ล้าง buffer/state ทั้งหมด */
      stop: function () { if (timer) { clearInterval(timer); timer = 0; } buffers = {}; localObj = null; return this; },

      _buffers: function () { return buffers; }   // debug/test
    };
  }

  window.KampaiNet = { version: '1.0.0', create: create };
})();
