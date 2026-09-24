import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  getCurrentPorterAssignment,
  getFinishedJobs,
  getStaffDisplayName,
  getWaitingJobs,
  type PorterCenter,
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

export async function POST(
  request: Request,
) {
  try {
    const cookieStore =
      await cookies();

    const staffNo =
      String(
        cookieStore.get(
          "porterStaffNo",
        )?.value ?? "",
      ).trim();

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

    let body: RequestBody = {};

    try {
      body =
        (
          await request.json()
        ) as RequestBody;
    } catch {
      body = {};
    }

    const requestedView =
      String(
        body.view ?? "ศูนย์เปล ER",
      ).trim();

    const viewMode:
      | PorterCenter
      | "finished" =
      requestedView === "ศูนย์เปล OPD"
        ? "ศูนย์เปล OPD"
        : requestedView === "finished"
          ? "finished"
          : "ศูนย์เปล ER";

    const [
        staffName,
        currentAssignment,
        erJobs,
        opdJobs,
        finishedJobs,
      ] = await Promise.all([
        getStaffDisplayName(
          staffNo,
        ),

        getCurrentPorterAssignment(
          staffNo,
        ),

        getWaitingJobs(
          "ศูนย์เปล ER",
        ),

        getWaitingJobs(
          "ศูนย์เปล OPD",
        ),

        viewMode === "finished"
          ? getFinishedJobs(
              staffNo,
            )
          : Promise.resolve([]),
      ]);

    const alertJobs = [
      ...erJobs,
      ...opdJobs,
    ];

    const jobs =
      viewMode === "finished"
        ? finishedJobs
        : viewMode === "ศูนย์เปล OPD"
          ? opdJobs
          : erJobs;

    return NextResponse.json(
      {
        success: true,
        staffNo,
        staffName,
        currentAssignment,
        jobs,
        alertJobs,
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