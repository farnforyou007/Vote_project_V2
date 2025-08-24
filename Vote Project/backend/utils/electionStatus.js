// utils/electionStatus.js
const TH_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Bangkok +07:00 แบบง่าย

const Auto = {
  UPCOMING_REGISTRATION: "UPCOMING_REGISTRATION",
  REGISTRATION_OPEN: "REGISTRATION_OPEN",
  WAITING_VOTE: "WAITING_VOTE",
  VOTING_OPEN: "VOTING_OPEN",
  ENDED: "ENDED",
};

const Effective = {
  CLOSED_BY_ADMIN: "CLOSED_BY_ADMIN",
  VOTING_OPEN: "VOTING_OPEN",
  ...Auto,
};

function toMs(d) {
  return d ? new Date(d).getTime() : null;
}

/**
 * nowTH: ให้สอดคล้องเวลาไทย
 * หมายเหตุ: ถ้าคุณตั้ง TZ=Asia/Bangkok ใน env ของ Node ได้ ยิ่งดี (จะไม่ต้องชดเชย +7 เอง)
 */
// function nowTH() {
//   const nowUtc = Date.now();
//   // ถ้าเครื่องคุณรันใน UTC: บวก +7h / ถ้าตั้งเครื่องแล้วเป็น +7 อยู่ จะได้เวลาคลาดเคลื่อนเล็กน้อย
//   // ใช้วิธีนี้แบบ conservative: แปลงเป็น “ประมาณไทย” ด้วย offset คงที่
//   return new Date(nowUtc + TH_OFFSET_MS);
// }
function nowTH() {
  // Node runtime อยู่ใน Asia/Bangkok อยู่แล้ว
  return new Date();
}

function isBetween(t, start, end) {
  return (start === null || t >= start) && (end === null || t <= end);
}

/**
 * คำนวณสถานะอัตโนมัติจากคอลัมน์วันที่
 * election = { registration_start, registration_end, start_date, end_date, manual_override, status_note }
 */
function computeAutoStatus(election, now = nowTH()) {
  const t = now.getTime();
  const rs = toMs(election.registration_start);
  const re = toMs(election.registration_end);
  const vs = toMs(election.start_date);
  const ve = toMs(election.end_date);

  if (rs && t < rs)
    return {
      auto_status: Auto.UPCOMING_REGISTRATION,
      reason: "ยังไม่ถึงวันรับสมัคร",
    };
  if (rs && re && isBetween(t, rs, re))
    return {
      auto_status: Auto.REGISTRATION_OPEN,
      reason: "อยู่ในช่วงรับสมัคร",
    };
  if (re && t > re && vs && t < vs)
    return {
      auto_status: Auto.WAITING_VOTE,
      reason: "ปิดรับสมัครแล้ว รอวันโหวต",
    };
  if (vs && ve && isBetween(t, vs, ve))
    return { auto_status: Auto.VOTING_OPEN, reason: "กำลังเปิดลงคะแนน" };
  if (ve && t > ve)
    return { auto_status: Auto.ENDED, reason: "สิ้นสุดการลงคะแนนแล้ว" };
  // fallback
  return {
    auto_status: Auto.UPCOMING_REGISTRATION,
    reason: "สถานะเริ่มต้น/ข้อมูลวันที่ไม่ครบ",
  };
}

function computeEffectiveStatus(election, now = nowTH()) {
  const { auto_status, reason } = computeAutoStatus(election, now);
  const override = election.manual_override || "AUTO";

  if (override === "FORCE_CLOSED") {
    return {
      auto_status,
      effective_status: Effective.CLOSED_BY_ADMIN,
      manual_override: override,
      reason: election.status_note || "ปิดชั่วคราวโดยผู้ดูแล",
    };
  }
  if (override === "FORCE_OPEN") {
    return {
      auto_status,
      effective_status: Effective.VOTING_OPEN,
      manual_override: override,
      reason: election.status_note || "เปิดลงคะแนนแบบบังคับโดยผู้ดูแล",
    };
  }
  return {
    auto_status,
    effective_status: auto_status,
    manual_override: "AUTO",
    reason,
  };
}

module.exports = {
  Auto,
  Effective,
  computeAutoStatus,
  computeEffectiveStatus,
  nowTH,
};
