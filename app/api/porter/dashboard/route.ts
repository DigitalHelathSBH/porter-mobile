import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  getFinishedJobs,
  getStaffDisplayName,
  getWaitingJobs,
} from "@/lib/porter";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type RequestBody = {
  view?: unknown;
};

/**
 * POST /api/porter/dashboard
 *
 * ใช้สำหรับโหลดข้อมูลหน้า Dashboard
 *
 * - ไม่มี GET
 * - อ่าน staffNo จาก Cookie
 * - ไม่รับ staffNo จาก URL
 * - ไม่รับ staffNo จาก Client
 */
export async function POST(
  request: Request,
) {
  try {
    // =========================
    // อ่าน Cookie
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
    // =========================
    if (!staffNo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเข้าสู่ระบบใหม่",
        },
        {
          status: 401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    // =========================
    // อ่าน Request Body
    // =========================
    let body: RequestBody = {};

    try {
      body =
        (
          await request.json()
        ) as RequestBody;
    } catch {
      body = {};
    }

    // =========================
    // active / finished
    // =========================
    const viewMode =
      String(
        body.view ?? "active",
      ).trim() === "finished"
        ? "finished"
        : "active";

    // =========================
    // โหลดชื่อพนักงาน
    // และรายการงาน
    // =========================
    const [
      staffName,
      jobs,
    ] =
      await Promise.all([
        getStaffDisplayName(
          staffNo,
        ),

        viewMode === "finished"
          ? getFinishedJobs(
              staffNo,
            )
          : getWaitingJobs(),
      ]);

    // =========================
    // สำเร็จ
    // =========================
    return NextResponse.json(
      {
        success: true,

        staffNo,
        staffName,
        jobs,

        viewMode,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "POST /api/porter/dashboard error:",
      error,
    );

    // =========================
    // Database / Server Error
    // =========================
    return NextResponse.json(
      {
        success: false,

        message:
          "โหลดข้อมูลรายการงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}