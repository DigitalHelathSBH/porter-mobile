import {
  cookies,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import PorterCurrentJob
  from "@/components/porter-current-job";

export const dynamic =
  "force-dynamic";

export default async function CurrentJobPage() {
  // =========================
  // ตรวจ Login Session
  // จาก HttpOnly Cookie
  // =========================
  const cookieStore =
    await cookies();

  const staffNo =
    String(
      cookieStore.get(
        "porterStaffNo",
      )?.value ?? "",
    ).trim();

  // =========================
  // ไม่มี Login Session
  // กลับหน้า Login
  // =========================
  if (!staffNo) {
    redirect(
      "/mobile-porter/login",
    );
  }

  // =========================
  // แสดงหน้ากำลังทำงาน
  //
  // PorterCurrentJob
  // จะโหลดงานปัจจุบันผ่าน
  // POST /api/porter/current-assignment
  // =========================
  return (
    <PorterCurrentJob
      staffNo={staffNo}
    />
  );
}