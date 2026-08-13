import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/**
 * POST
 * ออกจากระบบพนักงานเปล
 *
 * ลบ Cookie ที่ใช้เก็บข้อมูลผู้ใช้งาน
 *
 * POST /api/mobile-porter/logout
 */
export async function POST() {
  try {
    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "ออกจากระบบสำเร็จ",
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        },
      );

    /**
     * ลบ Cookie รหัสพนักงาน
     */
    response.cookies.set(
      "porterStaffNo",
      "",
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      },
    );

    /**
     * ลบ Cookie ชื่อพนักงาน
     */
    response.cookies.set(
      "porterStaffName",
      "",
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      },
    );

    return response;
  } catch (error) {
    console.error(
      "POST /api/mobile-porter/logout error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
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