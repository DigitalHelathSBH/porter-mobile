import {
  cookies,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import PorterDetailLoader
  from "@/components/porter-detail-loader";

type PageProps = {
  params: Promise<{
    reqNo: string;
  }>;
};

export const dynamic =
  "force-dynamic";

export default async function PorterJobDetailPage({
  params,
}: PageProps) {
  // =========================
  // อ่าน ReqNo จาก URL
  // =========================
  const routeParams =
    await params;

  const reqNo =
    String(
      routeParams.reqNo ?? "",
    ).trim();

  // =========================
  // ตรวจ Login session
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
  // ReqNo ไม่ถูกต้อง
  // =========================
  if (!reqNo) {
    redirect(
      "/mobile-porter",
    );
  }

  // =========================
  // ไม่ Query DB ใน page.tsx แล้ว
  //
  // PorterDetailLoader
  // จะเรียก:
  //
  // POST /api/porter/job-detail
  //
  // เพื่อโหลดข้อมูลจริง
  // =========================
  return (
    <PorterDetailLoader
      reqNo={reqNo}
    />
  );
}