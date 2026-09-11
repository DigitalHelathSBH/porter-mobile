import {
  cookies,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import PorterDashboardLoader from "@/components/porter-dashboard-loader";

export const dynamic =
  "force-dynamic";

type DashboardView =
  | "active"
  | "finished";

type PageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

export default async function MobilePorterPage({
  searchParams,
}: PageProps) {
  // =========================
  // อ่านรหัสพนักงานจาก Cookie
  // ไม่ใช้ ?userid=... แล้ว
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
  // ไม่มี Login session
  // ให้กลับหน้า Login
  // =========================
  if (!staffNo) {
    redirect(
      "/mobile-porter/login",
    );
  }

  // =========================
  // อ่าน View
  // active / finished
  // =========================
  const params =
    await searchParams;

  const viewMode: DashboardView =
    params.view === "finished"
      ? "finished"
      : "active";

  // =========================
  // Dashboard พร้อม Auto-refresh
  // PorterDashboardLoader จะโหลดข้อมูล
  // และ refresh ทุก 30 วินาทีเอง
  // =========================
  return (
    <PorterDashboardLoader
      viewMode={viewMode}
    />
  );
}