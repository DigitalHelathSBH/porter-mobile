import PorterDashboard from "@/components/porter-dashboard";

import type { PorterJob } from "@/types/porter";

/**
 * ข้อมูลจำลองสำหรับดูหน้าสถานะเสร็จสิ้น
 *
 * ไม่มีการเชื่อมต่อหรือแก้ไขฐานข้อมูล
 */
const mockFinishedJobs: PorterJob[] = [
  {
    reqNo: "Req20260805-501",
    locSource: "Stroke unit",
    locDest: "(15) ตึกอุบัติเหตุชั้น 4 (อ.4)",
    locAct: "ย้ายผู้ป่วย",
    shift: "เช้า",
    bedType: "รถนั่งพร้อมเสาน้ำเกลือ",
    fastTrack: "0",
    fastTrackText: "ปกติ (ภายใน 25 นาที)",
    remark: "ผู้ป่วยรู้สึกตัวดี",
    equipment: "เสาน้ำเกลือ",
    createdAt: "05/08/2569 08:15:20",
    createdAtShort: "08:15",
    createdBy: "K0292",
    status: "เสร็จสิ้น",
    currentProc: "-",
    bedNo: "6910",
    cradleStaffNo: "L0281",
    assignedAt: "05/08/2569 08:20:00",
    finishedAt: "05/08/2569 08:42:15",
  },

  {
    reqNo: "Req20260805-502",
    locSource: "แผนกผู้ป่วยนอกอายุรกรรม",
    locDest: "(34) พิเศษ 210 เตียง ชั้น 1",
    locAct: "กลับบ้าน",
    shift: "เช้า",
    bedType: "รถเข็นนั่ง",
    fastTrack: "1",
    fastTrackText: "ด่วน (ภายใน 15 นาที)",
    remark: "-",
    equipment: "-",
    createdAt: "05/08/2569 10:05:11",
    createdAtShort: "10:05",
    createdBy: "K0198",
    status: "เสร็จสิ้น",
    currentProc: "-",
    bedNo: "2104",
    cradleStaffNo: "L0281",
    assignedAt: "05/08/2569 10:08:00",
    finishedAt: "05/08/2569 10:17:48",
  },

  {
    reqNo: "Req20260805-503",
    locSource: "ห้องทันตกรรม",
    locDest: "(100) ห้องไตเทียม",
    locAct: "ย้าย Ward",
    shift: "บ่าย",
    bedType: "รถนอน",
    fastTrack: "2",
    fastTrackText: "FastTrack (ทันที)",
    remark: "เคสเร่งด่วน",
    equipment: "ออกซิเจน",
    createdAt: "05/08/2569 13:25:30",
    createdAtShort: "13:25",
    createdBy: "K0225",
    status: "เสร็จสิ้น",
    currentProc: "-",
    bedNo: "1806",
    cradleStaffNo: "L0281",
    assignedAt: "05/08/2569 13:26:00",
    finishedAt: "05/08/2569 13:33:09",
  },
];

export default function PreviewFinishedPage() {
  return (
    <PorterDashboard
      staffNo="L0281"
      staffName="นางสาวพรหมล บุษบากรกุล"
      jobs={mockFinishedJobs}
      viewMode="finished"
    />
  );
}