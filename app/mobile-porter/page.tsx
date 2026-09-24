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
  | "ศูนย์เปล ER"
  | "ศูนย์เปล OPD"
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
  params.view === "ศูนย์เปล OPD"
    ? "ศูนย์เปล OPD"
    : params.view === "finished"
      ? "finished"
      : "ศูนย์เปล ER";

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