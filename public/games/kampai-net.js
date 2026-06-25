/*!
 * kampai-net.js — ชั้น "netcode" สำหรับเกมออนไลน์ kampai-school
 *
 * แก้ "กระตุก" + ขยายเกิน 2 คน ด้วยเทคนิคมาตรฐานเกมเน็ตเวิร์ก. รองรับ 2 โหมด:
 *
 * ── โหมด A · peer-broadcast (แต่ละเครื่อง broadcast ตัวเอง) ──
 *   เหมาะกับเกมที่ทุกคนจำลองตัวเอง (race/วิ่ง). ใช้ localState() ส่ง · view(peerId) อ่านแบบ interpolate
 *
 * ── โหมด B · host-authority (star topology — รองรับหลายคน) ──
 *   host จำลองโลกทั้งหมด + broadcast world snapshot; peer ส่งแค่ input. ตัด authority-fighting +
 *   traffic O(N) แทน mesh O(N²). host: localWorld(ents) · peer: localInput(obj) + viewEntity(id) อ่านโลก
 *
 * หัวใจ (ใช้ทั้ง 2 โหมด):
 *   • network tick แยกจาก render — ส่ง state คงที่ tickHz (เช่น 20Hz) ไม่ผูก 60fps
 *   • snapshot interpolation — ฝั่งรับ "เรนเดอร์ย้อนหลัง" interpDelay ms แล้ว lerp ระหว่าง 2 snapshot
 *     → ขยับลื่นแม้แพ็กเก็ตมาเป็นช่วง ๆ (แทนการ set ตำแหน่งดิบที่กระโดดเป็นก้อน)
 *   • timebase = เวลา "ตอนรับ" ของเครื่องเรา (perf.now) → ไม่ต้อง sync นาฬิกาข้ามเครื่อง (ไม่มี clock skew)
 *
 * transport-agnostic: ไม่ยึดห้องเอง — เกม/KampaiMatch เป็นเจ้าของห้อง แล้วป้อน event ผ่าน net.receive()
 * net ส่งออกผ่าน opts.emit (default = KAMPAI.online.send(event, payload))
 *
 * ใช้ (โหมด A):
 *   const net = KampaiNet.create({ tickHz:20, interpDelay:100, fields:['x','y'], angleFields:['angle'] });
 *   KAMPAI.online.join(room, { onPresence, onEvent:(ev,d,from)=>{ if (net.receive(ev,d,from)) return; ...} });
 *   net.start();
 *   // ทุกเฟรม: net.localState({x:me.x,y:me.y,angle:me.a});  ตอนวาดคู่แข่ง: net.view(peerId)
 *
 * ใช้ (โหมด B): net.setHost(isRoomCreator)
 *   host ทุกเฟรม: net.localWorld({ p1:{x,y}, p2:{x,y}, ball:{x,y} });  // โลกทั้งหมด
 *   peer ทุกเฟรม: net.localInput({ up:true, fire:false });  อ่าน input ฝั่ง host: net.input(peerId)
 *   วาดโลก (ทั้ง host/peer ฝั่ง peer): net.viewEntity('ball') → {x,y} interpolated
 *
 * เอกสาร: GAME.md (Online Multiplayer Framework → Netcode)
 */
(function () {
  'use strict';

  function perfNow() { return (window.performance && performance.now()) || Date.now(); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function create(opts) {
    opts = opts || {};
    var tickHz = opts.tickHz || 20;
    var interpDelay = opts.interpDelay != null ? opts.interpDelay : 100;
    var fields = opts.fields || ['x', 'y'];
    var angleFields = opts.angleFields || [];
    var precision = opts.precision != null ? opts.precision : 2;
    var evName = opts.event || 'net';        // โหมด A: state ผู้เล่นเรา
    var worldEv = opts.worldEvent || 'world'; // โหมด B: world snapshot (host→peers)
    var inputEv = opts.inputEvent || 'input'; // โหมด B: input (peer→host)
    // emit(event,payload) — default ผ่าน KAMPAI.online; opts.emit สำหรับ custom; opts.send (payload-only) = back-compat โหมด A
    var emit = opts.emit
      || (opts.send ? function (ev, p) { opts.send(p); }
        : function (ev, p) { if (window.KAMPAI && window.KAMPAI.online) window.KAMPAI.online.send(ev, p); });
    var holdMs = interpDelay + 1000;
    var pow = Math.pow(10, precision);

    var isHost = !!opts.host;
    var buffers = {};         // โหมด A: peerId -> [{ t, s }]
    var worldBuf = [];        // โหมด B: [{ t, ents:{ id:state } }]
    var inputs = {};          // โหมด B (host): peerId -> { t, v:input }
    var localObj = null;      // โหมด A: state ของเรา
    var localWorldObj = null; // โหมด B (host): โลก authoritative
    var localInputObj = null; // โหมด B (peer): input ของเรา
    var timer = 0;
    // เฟส 3: client-side prediction (peer ทำนายตัวเองให้ตอบสนอง input ทันที + reconcile เข้าหา host แบบนุ่ม)
    var predLocalId = opts.localId || null;     // entity id ของ "เรา" ในโลก
    var predStep = null;                        // step(state,input,dt)→newState (เกมจัดหา)
    var predFields = fields;
    var predBlend = (opts.blend != null ? opts.blend : 0.1);  // แรงดึงเข้าหา authoritative ต่อเฟรม (0..1)
    var predMaxLead = (opts.maxLead != null ? opts.maxLead : null);  // กันทำนายนำ host เกินขีด (กันทะลุกำแพง) · null=ปิด
    var predicted = null, authLocal = null;     // predicted = สถานะเราที่ทำนาย · authLocal = authoritative ล่าสุดของเรา

    function roundN(v) { return Math.round(v * pow) / pow; }
    function compact(o) {
      var out = {};
      for (var k in o) if (has(o, k)) { var v = o[k]; out[k] = (typeof v === 'number') ? roundN(v) : v; }
      return out;
    }
    function compactWorld(w) {
      var out = {};
      for (var id in w) if (has(w, id)) out[id] = compact(w[id]);
      return out;
    }

    function tick() {
      if (localObj) emit(evName, compact(localObj));                          // โหมด A
      if (isHost) { if (localWorldObj) emit(worldEv, { ents: compactWorld(localWorldObj) }); } // โหมด B: host
      else if (localInputObj) emit(inputEv, localInputObj);                   // โหมด B: peer
    }

    function lerpAngle(a, b, f) { var d = (((b - a) % 360) + 540) % 360 - 180; return a + d * f; }
    function lerpState(a, b, f) {
      var out = {};
      for (var k in b) if (has(b, k)) out[k] = b[k];   // ฟิลด์ที่ไม่ interp → จาก snapshot ใหม่กว่า
      for (var i = 0; i < fields.length; i++) { var kf = fields[i]; if (typeof a[kf] === 'number' && typeof b[kf] === 'number') out[kf] = a[kf] + (b[kf] - a[kf]) * f; }
      for (var j = 0; j < angleFields.length; j++) { var ka = angleFields[j]; if (typeof a[ka] === 'number' && typeof b[ka] === 'number') out[ka] = lerpAngle(a[ka], b[ka], f); }
      return out;
    }

    // interpolate ทั่วไปบน buffer [{t,...}] — getState(entry) คืน state ของ entry (หรือ null ถ้าไม่มี entity นั้น)
    function interp(buf, getState) {
      if (!buf || !buf.length) return null;
      var renderT = perfNow() - interpDelay;
      if (renderT <= buf[0].t) return getState(buf[0]);   // ประวัติไม่พอ → เก่าสุด
      for (var i = buf.length - 1; i >= 0; i--) {
        if (buf[i].t <= renderT) {
          var a = buf[i], b = buf[i + 1];
          var sa = getState(a);
          if (!b) return sa;                              // starved → ใหม่สุด
          var sb = getState(b);
          if (sa == null) return sb;                      // entity เพิ่งโผล่ → ใช้ใหม่
          if (sb == null) return sa;                      // entity หายไป → ค้างเก่า
          var span = b.t - a.t; var f = span > 0 ? (renderT - a.t) / span : 0;
          return lerpState(sa, sb, f);
        }
      }
      return getState(buf[buf.length - 1]);
    }
    function trim(buf, nowT) { var cut = nowT - holdMs; while (buf.length > 2 && buf[0].t < cut) buf.shift(); }

    return {
      version: '1.2.0',
      tickHz: tickHz,
      interpDelay: interpDelay,

      /** โหมด A: ตั้ง state ผู้เล่นเรา (net sample ส่งเองที่ tickHz) */
      localState: function (o) { localObj = o; return this; },
      /** โหมด B (host): ตั้งโลก authoritative ทั้งหมด { id:state } */
      localWorld: function (w) { localWorldObj = w; return this; },
      /** โหมด B (peer): ตั้ง input ของเรา */
      localInput: function (o) { localInputObj = o; return this; },
      /** กำหนด/สลับ role เป็น host (เจ้าภาพจำลองโลก) */
      setHost: function (b) { isHost = !!b; return this; },
      /** เป็น host หรือไม่ */
      isHost: function () { return isHost; },

      /** ป้อน event ที่ได้รับ. คืน true ถ้า net จัดการแล้ว (เกมไม่ต้องทำต่อ) */
      receive: function (ev, data, fromKey) {
        if (!data) return false;
        if (ev === evName) {                              // โหมด A: peer-state
          if (!fromKey) return false;
          var buf = buffers[fromKey] || (buffers[fromKey] = []);
          var t = perfNow(); buf.push({ t: t, s: data }); trim(buf, t); return true;
        }
        if (ev === worldEv) {                             // โหมด B: world snapshot
          var tw = perfNow(); var wents = (data.ents || data);
          worldBuf.push({ t: tw, ents: wents }); trim(worldBuf, tw);
          if (predLocalId && wents && has(wents, predLocalId)) authLocal = wents[predLocalId];  // เฟส 3: เก็บ authoritative ของเรา
          return true;
        }
        if (ev === inputEv) {                             // โหมด B: peer input (เก็บล่าสุดต่อ peer)
          if (!fromKey) return false;
          inputs[fromKey] = { t: perfNow(), v: data }; return true;
        }
        return false;
      },

      /** โหมด A: อ่าน state คู่แข่งแบบ interpolated (ลื่น) — คืน object หรือ null */
      view: function (id) { var buf = buffers[id]; return buf ? interp(buf, function (e) { return e.s; }) : null; },
      /** โหมด B: อ่าน entity ในโลกแบบ interpolated */
      viewEntity: function (id) {
        return interp(worldBuf, function (e) { return (e.ents && has(e.ents, id)) ? e.ents[id] : null; });
      },

      /** ค่าดิบล่าสุด (ไม่ interpolate) — สำหรับฟิลด์ที่ต้องการค่าจริงทันที เช่น score */
      latest: function (id) { var b = buffers[id]; return (b && b.length) ? b[b.length - 1].s : null; },
      latestEntity: function (id) { if (!worldBuf.length) return null; var e = worldBuf[worldBuf.length - 1].ents; return (e && has(e, id)) ? e[id] : null; },

      /** โหมด B (host): input ล่าสุดจาก peer หนึ่งคน / ทุกคน */
      input: function (peerId) { return inputs[peerId] ? inputs[peerId].v : null; },
      inputs: function () { var out = {}; for (var k in inputs) if (has(inputs, k)) out[k] = inputs[k].v; return out; },

      /** ราย id ของ peer (โหมด A) / entity ในโลกล่าสุด (โหมด B) */
      peers: function () { return Object.keys(buffers); },
      entityIds: function () { return worldBuf.length ? Object.keys(worldBuf[worldBuf.length - 1].ents || {}) : []; },

      /** เฟส 3: ตั้งค่า client-side prediction — step(state,input,dt)→newState · init=สถานะเริ่ม · localId=entity เรา */
      predictor: function (cfg) {
        cfg = cfg || {};
        predStep = cfg.step || null;
        if (cfg.fields) predFields = cfg.fields;
        if (cfg.blend != null) predBlend = cfg.blend;
        if (cfg.maxLead != null) predMaxLead = cfg.maxLead;
        if (cfg.localId) predLocalId = cfg.localId;
        predicted = cfg.init ? Object.assign({}, cfg.init) : {};
        return this;
      },
      /** เฟส 3: บอกว่า entity ไหนในโลกคือ "เรา" (สำหรับ reconcile) */
      setLocalId: function (id) { predLocalId = id; return this; },
      /** เฟส 3: เดิน prediction 1 เฟรม — ตอบสนอง input ทันที + reconcile เข้าหา authoritative แบบนุ่ม (กันทะลุกำแพง) */
      predictStep: function (dt, input) {
        if (!predStep) return this;
        var next = predStep(predicted, input, dt);
        if (next) predicted = next;
        if (authLocal && predicted) {
          for (var i = 0; i < predFields.length; i++) {
            var f = predFields[i];
            if (typeof predicted[f] === 'number' && typeof authLocal[f] === 'number') {
              predicted[f] += (authLocal[f] - predicted[f]) * predBlend;       // reconcile แบบนุ่ม
              if (predMaxLead != null) {                                       // กันนำ host เกินขีด (กันทะลุกำแพง/rubber-band เกิน)
                var lead = predicted[f] - authLocal[f];
                if (lead > predMaxLead) predicted[f] = authLocal[f] + predMaxLead;
                else if (lead < -predMaxLead) predicted[f] = authLocal[f] - predMaxLead;
              }
            }
          }
        }
        return this;
      },
      /** เฟส 3: สถานะ "เรา" สำหรับวาด (predicted + reconciled) — ตอบสนองทันที ไม่ดีเลย์ */
      localView: function () { return predicted; },
      localAuth: function () { return authLocal; },   // debug

      /** ลบ peer (ตอนออกห้อง) + sync กับรายชื่อปัจจุบัน */
      dropPeer: function (id) { delete buffers[id]; delete inputs[id]; return this; },
      syncPeers: function (ids) {
        var keep = {}; (ids || []).forEach(function (id) { keep[id] = 1; });
        Object.keys(buffers).forEach(function (id) { if (!keep[id]) delete buffers[id]; });
        Object.keys(inputs).forEach(function (id) { if (!keep[id]) delete inputs[id]; });
        return this;
      },

      /** เริ่ม network tick */
      start: function () { if (!timer) timer = setInterval(tick, Math.max(20, Math.round(1000 / tickHz))); return this; },
      /** หยุด + ล้างทุกอย่าง */
      stop: function () {
        if (timer) { clearInterval(timer); timer = 0; }
        buffers = {}; worldBuf = []; inputs = {}; localObj = null; localWorldObj = null; localInputObj = null;
        predicted = null; authLocal = null; return this;
      },

      _buffers: function () { return buffers; },   // debug/test
      _world: function () { return worldBuf; },
      _tick: function () { tick(); return this; }   // debug/test — เรียก tick เอง(ปกติใช้ start())
    };
  }

  window.KampaiNet = { version: '1.2.0', create: create };
})();
