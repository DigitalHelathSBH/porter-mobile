import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
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
  reqNo?: unknown;
};

/**
 * POST /api/porter/job-detail
 *
 * โหลดรายละเอียดงานผ่าน POST
 *
 * - ไม่มี GET
 * - reqNo รับจาก Request Body
 * - staffNo อ่านจาก HttpOnly Cookie
 * - ไม่ใช้ ?userid=...
 */
export async function POST(
  request: Request,
) {
  try {
    // =========================
    // ตรวจ Login Session
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
    let body:
      RequestBody;

    try {
      body =
        (
          await request.json()
        ) as RequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "รูปแบบข้อมูลไม่ถูกต้อง",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    // =========================
    // อ่าน ReqNo
    // =========================
    const reqNo =
      String(
        body.reqNo ?? "",
      ).trim();

    // =========================
    // ไม่มี ReqNo
    // =========================
    if (!reqNo) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่พบรหัสงาน",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    // =========================
    // โหลดรายการงาน
    // และชื่อพนักงาน
    // =========================
    const [
      jobs,
      staffName,
    ] =
      await Promise.all([
        getWaitingJobs(),

        getStaffDisplayName(
          staffNo,
        ),
      ]);

    // =========================
    // ค้นหางานจาก ReqNo
    // =========================
    const normalizedReqNo =
      reqNo.toLowerCase();

    const job =
      jobs.find(
        (item) =>
          String(
            item.reqNo ?? "",
          )
            .trim()
            .toLowerCase()
          === normalizedReqNo,
      );

    // =========================
    // ไม่พบงาน
    //
    // อาจเกิดจาก:
    // - มีคนอื่นรับไปแล้ว
    // - สถานะเปลี่ยน
    // - งานไม่ใช่งานวันนี้
    // =========================
    if (!job) {
      return NextResponse.json(
        {
          success: false,

          message:
            "งานนี้อาจมีพนักงานคนอื่นรับไปแล้ว หรือข้อมูลมีการเปลี่ยนแปลง",

          staffNo,
          staffName,

          job: null,
        },
        {
          status: 404,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    // =========================
    // สำเร็จ
    // =========================
    return NextResponse.json(
      {
        success: true,

        staffNo,
        staffName,

        job,
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
      "POST /api/porter/job-detail error:",
      error,
    );

    // =========================
    // Database / Server Error
    // =========================
    return NextResponse.json(
      {
        success: false,

        message:
          "โหลดรายละเอียดงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
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