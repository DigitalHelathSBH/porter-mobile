import { NextResponse } from "next/server";

import {
  cancelPorterJobDb,
} from "@/lib/porter";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type RequestBody = {
  reqNo?: unknown;
  staffNo?: unknown;
};

function getText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

function getErrorStatus(
  code: string,
): number {
  switch (code) {
    case "INVALID_INPUT":
      return 400;

    case "NOT_FOUND":
      return 404;

    case "ALREADY_ASSIGNED":
    case "ALREADY_FINISHED":
    case "STAFF_HAS_ACTIVE_JOB":
    case "NOT_OWNER":
    case "NOT_ACTIVE":
      return 409;

    default:
      return 500;
  }
}

async function readBody(
  request: Request,
): Promise<RequestBody | null> {
  try {
    return (
      await request.json()
    ) as RequestBody;
  } catch {
    return null;
  }
}

/**
 * POST
 * ยกเลิกงานจริงและปลดล็อกงาน
 *
 * POST /api/porter/assignment/cancel
 */
export async function POST(
  request: Request,
) {
  try {
    const body =
      await readBody(
        request,
      );

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
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

    const reqNo =
      getText(
        body.reqNo,
      );

    const staffNo =
      getText(
        body.staffNo,
      );

    if (
      !reqNo
      || !staffNo
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "ไม่พบรหัสงานหรือรหัสพนักงาน",
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

    const result =
      await cancelPorterJobDb(
        reqNo,
        staffNo,
      );

    return NextResponse.json(
      result,
      {
        status:
          result.success
            ? 200
            : getErrorStatus(
                result.code,
              ),

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "POST /api/porter/assignment/cancel error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        code: "DATABASE_ERROR",
        message:
          "ยกเลิกงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
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