import { NextResponse } from "next/server";

import {
  acceptPorterJobDb,
  cancelPorterJobDb,
  finishPorterJobDb,
  getCurrentPorterAssignment,
} from "@/lib/porter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
 * GET
 * อ่านงานปัจจุบันของพนักงานจาก DB จริง
 */
export async function GET(
  request: Request,
): Promise<NextResponse> {
  try {
    const url =
      new URL(
        request.url,
      );

    const staffNo =
      getText(
        url.searchParams.get(
          "staffNo",
        ),
      );

    if (!staffNo) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "ไม่พบรหัสพนักงาน",
          assignment: null,
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

    const assignment =
      await getCurrentPorterAssignment(
        staffNo,
      );

    return NextResponse.json(
      {
        success: true,
        assignment,
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
      "GET /api/porter/assignment error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "โหลดงานปัจจุบันไม่สำเร็จ",
        assignment: null,
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

/**
 * POST
 * รับงานจริง
 */
export async function POST(
  request: Request,
): Promise<NextResponse> {
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
      },
    );
  }

  const result =
    await acceptPorterJobDb(
      getText(
        body.reqNo,
      ),
      getText(
        body.staffNo,
      ),
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
          "no-store",
      },
    },
  );
}

/**
 * DELETE
 * ยกเลิกงานจริงและปลดล็อก
 */
export async function DELETE(
  request: Request,
): Promise<NextResponse> {
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
      },
    );
  }

  const result =
    await cancelPorterJobDb(
      getText(
        body.reqNo,
      ),
      getText(
        body.staffNo,
      ),
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
          "no-store",
      },
    },
  );
}

/**
 * PATCH
 * เสร็จสิ้นงานจริง
 */
export async function PATCH(
  request: Request,
): Promise<NextResponse> {
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
      },
    );
  }

  const result =
    await finishPorterJobDb(
      getText(
        body.reqNo,
      ),
      getText(
        body.staffNo,
      ),
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
          "no-store",
      },
    },
  );
}