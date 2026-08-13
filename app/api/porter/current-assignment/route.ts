import { NextResponse } from "next/server";

import {
  getCurrentPorterAssignment,
} from "@/lib/porter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestBody = {
  staffNo?: unknown;
};

function getText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const staffNo =
      getText(body.staffNo);

    if (!staffNo) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "ไม่พบรหัสพนักงาน",
          assignment: null,
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
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
      "POST /api/porter/current-assignment error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        code: "DATABASE_ERROR",
        message:
          "โหลดงานปัจจุบันไม่สำเร็จ",
        assignment: null,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}