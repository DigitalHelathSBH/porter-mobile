import {
  cookies,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import PorterDashboardLoader
  from "@/components/porter-dashboard-loader";

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
  // อ่าน Login session
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
  // ไม่มี Login session
  // กลับหน้า Login
  // =========================
  if (!staffNo) {
    redirect(
      "/mobile-porter/login",
    );
  }

  // =========================
  // อ่าน View ของหน้า
  // =========================
  const params =
    await searchParams;

  const viewMode: DashboardView =
    params.view === "finished"
      ? "finished"
      : "active";

  // =========================
  // ไม่ Query Database
  // จาก page.tsx แล้ว
  //
  // PorterDashboardLoader
  // จะโหลดข้อมูลผ่าน POST API
  // =========================
  return (
    <PorterDashboardLoader
      viewMode={viewMode}
    />
  );
}