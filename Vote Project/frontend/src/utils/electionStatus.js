// utils/dateUtils.js
export const translateStatus = (status) =>    {
  switch (status) {
    // ✅ สถานะใหม่ (Backend Hybrid)
    case 'UPCOMING_REGISTRATION': return 'ยังไม่เปิดรับสมัคร';
    case 'REGISTRATION_OPEN':     return 'เปิดรับสมัคร';
    case 'WAITING_VOTE':          return 'รอโหวต';
    case 'VOTING_OPEN':           return 'เปิดลงคะแนน';
    case 'ENDED':                 return 'สิ้นสุดการลงคะแนน';
    case 'CLOSED_BY_ADMIN':       return 'ปิดชั่วคราวโดยผู้ดูแล';

    // (ถ้าหน้ายังมีของเก่าอยู่บ้าง ให้คง mapping เดิมด้วย)
    case 'registration':          return 'เปิดรับสมัคร';
    case 'active':                return 'กำลังโหวต';
    case 'completed':             return 'สิ้นสุดการลงคะแนน';
    case 'closed':                return 'ปิดชั่วคราวโดยผู้ดูแล';
    case 'before_registration':   return 'ยังไม่เปิดรับสมัคร';

    default:                      return 'ไม่ระบุ';
  }
}
