import type { PorterJob } from "@/types/porter";

export type PorterTestAssignment = {
  staffNo: string;
  staffName: string;
  assignedAt: string;
  job: PorterJob;
};

const STORAGE_PREFIX = "porter-test-active-job:";

function normalizeStaffNo(staffNo: string): string {
  return String(staffNo ?? "")
    .trim()
    .toUpperCase();
}

function getStorageKey(staffNo: string): string {
  return (
    STORAGE_PREFIX
    + normalizeStaffNo(staffNo)
  );
}

/**
 * อ่านงานที่กำลังดำเนินการจาก Browser
 */
export function loadTestAssignment(
  staffNo: string,
): PorterTestAssignment | null {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedStaffNo =
    normalizeStaffNo(staffNo);

  if (!normalizedStaffNo) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      getStorageKey(normalizedStaffNo),
    );

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(
      rawValue,
    ) as PorterTestAssignment;

    if (
      !parsed
      || !parsed.job
      || !parsed.job.reqNo
      || normalizeStaffNo(parsed.staffNo)
        !== normalizedStaffNo
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * บันทึกงานที่รับไว้ใน Browser
 * ไม่มีการบันทึกลงฐานข้อมูล
 */
export function saveTestAssignment(
  assignment: PorterTestAssignment,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedStaffNo =
    normalizeStaffNo(assignment.staffNo);

  if (!normalizedStaffNo) {
    throw new Error("ไม่พบรหัสพนักงาน");
  }

  window.localStorage.setItem(
    getStorageKey(normalizedStaffNo),
    JSON.stringify({
      ...assignment,
      staffNo: normalizedStaffNo,
    }),
  );
}

/**
 * ล้างงานปัจจุบัน เมื่อกดเสร็จสิ้นงาน
 */
export function clearTestAssignment(
  staffNo: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedStaffNo =
    normalizeStaffNo(staffNo);

  if (!normalizedStaffNo) {
    return;
  }

  window.localStorage.removeItem(
    getStorageKey(normalizedStaffNo),
  );
}

/**
 * จัดรูปแบบเวลาที่กดรับงาน
 */
export function formatTestAssignedAt(
  assignedAt: string,
): string {
  const date = new Date(assignedAt);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    },
  ).format(date);
}