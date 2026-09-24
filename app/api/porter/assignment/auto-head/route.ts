import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  autoAssignHeadJob,
  getPendingHeadJob,
  getCurrentPorterAssignment,
} from "@/lib/porter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestBody = {
  activate?: unknown;
};

function getBoolean(
  value: unknown,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const text = String(
    value ?? "",
  )
    .trim()
    .toLowerCase();

  return (
    text === "1" ||
    text === "true"
  );
}

export async function POST(
  request: Request,
) {
  try {
    let body: RequestBody = {};

    try {
      body =
        (await request.json()) as RequestBody;
    } catch {
      body = {};
    }

    const activate =
      getBoolean(
        body.activate,
      );

    const cookieStore =
      await cookies();

    const staffNo = String(
      cookieStore.get(
        "porterStaffNo",
      )?.value ?? "",
    ).trim();

    if (!staffNo) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "ไม่พบรหัสพนักงาน",
          assignment: null,
          pendingJob: null,
          currentAssignment: null,
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

    if (activate) {
      const assignment =
        await autoAssignHeadJob(
          staffNo,
        );

      const currentAssignment =
        assignment ??
        (await getCurrentPorterAssignment(
          staffNo,
        ));

      return NextResponse.json(
        {
          success: true,
          activated:
            !!assignment,
          assignment:
            assignment ?? null,
          pendingJob: null,
          currentAssignment:
            currentAssignment ?? null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const currentAssignment =
      await getCurrentPorterAssignment(
        staffNo,
      );

        const currentReqNos =
      (currentAssignment?.jobs ?? [])
        .map((job) => String(job.reqNo ?? "").trim())
        .filter((reqNo) => reqNo);

    const pendingJob =
      await getPendingHeadJob(
        staffNo,
        currentReqNos,
      );

    return NextResponse.json(
      {
        success: true,
        activated: false,
        assignment: null,
        pendingJob:
          pendingJob ?? null,
        currentAssignment:
          currentAssignment ?? null,
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
      "POST /api/porter/assignment/auto-head error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        code: "DATABASE_ERROR",
        message:
          "ตรวจสอบงานที่หัวหน้ามอบหมายไม่สำเร็จ",
        assignment: null,
        pendingJob: null,
        currentAssignment: null,
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