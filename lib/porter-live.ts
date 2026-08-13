"use client";

import type { PorterJob } from "@/types/porter";

export type PorterLiveAssignment = {
  staffNo: string;
  staffName: string;
  assignedAt: string;
  job: PorterJob;
};

export type PorterLiveErrorCode =
  | "ALREADY_ASSIGNED"
  | "ALREADY_FINISHED"
  | "STAFF_HAS_ACTIVE_JOB"
  | "NOT_FOUND"
  | "NOT_OWNER"
  | "NOT_ACTIVE"
  | "INVALID_INPUT"
  | "DATABASE_ERROR"
  | "REQUEST_FAILED";

export type PorterLiveActionResult =
  | {
      success: true;
      assignment?: PorterLiveAssignment;
    }
  | {
      success: false;
      code: PorterLiveErrorCode;
      message: string;
      assignment?: PorterLiveAssignment;
    };

type ApiBody = {
  success?: boolean;
  code?: string;
  message?: string;
  assignment?: PorterLiveAssignment | null;
};

async function readJson(
  response: Response,
): Promise<ApiBody> {
  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    !contentType.includes(
      "application/json",
    )
  ) {
    throw new Error(
      `API ตอบกลับไม่ถูกต้อง (${response.status})`,
    );
  }

  return response.json() as Promise<ApiBody>;
}

function normalizeErrorCode(
  code: string | undefined,
): PorterLiveErrorCode {
  switch (code) {
    case "ALREADY_ASSIGNED":
    case "ALREADY_FINISHED":
    case "STAFF_HAS_ACTIVE_JOB":
    case "NOT_FOUND":
    case "NOT_OWNER":
    case "NOT_ACTIVE":
    case "INVALID_INPUT":
    case "DATABASE_ERROR":
      return code;

    default:
      return "REQUEST_FAILED";
  }
}

/**
 * ตรวจงานปัจจุบันของพนักงาน
 *
 * POST /api/porter/current-assignment
 */
export async function getCurrentPorterAssignment(
  staffNo: string,
): Promise<PorterLiveAssignment | null> {
  const normalizedStaffNo =
    String(
      staffNo ?? "",
    ).trim();

  if (!normalizedStaffNo) {
    return null;
  }

  const response =
    await fetch(
      "/api/porter/current-assignment",
      {
        method:
          "POST",

        cache:
          "no-store",

        headers: {
          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-cache",
        },

        body:
          JSON.stringify({
            staffNo:
              normalizedStaffNo,
          }),
      },
    );

  const body =
    await readJson(
      response,
    );

  if (!response.ok) {
    throw new Error(
      body.message
        ?? "โหลดงานปัจจุบันไม่สำเร็จ",
    );
  }

  return body.assignment
    ?? null;
}

/**
 * รับงาน
 *
 * POST /api/porter/assignment/accept
 */
export async function acceptPorterJob(
  input: {
    reqNo: string;
    staffNo: string;
  },
): Promise<PorterLiveActionResult> {
  try {
    const response =
      await fetch(
        "/api/porter/assignment/accept",
        {
          method:
            "POST",

          cache:
            "no-store",

          headers: {
            "Content-Type":
              "application/json",

            "Cache-Control":
              "no-cache",
          },

          body:
            JSON.stringify(
              input,
            ),
        },
      );

    const body =
      await readJson(
        response,
      );

    if (
      response.ok
      && body.success
    ) {
      return {
        success:
          true,

        assignment:
          body.assignment
          ?? undefined,
      };
    }

    return {
      success:
        false,

      code:
        normalizeErrorCode(
          body.code,
        ),

      message:
        body.message
        ?? "รับงานไม่สำเร็จ",

      assignment:
        body.assignment
        ?? undefined,
    };
  } catch (error) {
    console.error(
      "acceptPorterJob error:",
      error,
    );

    return {
      success:
        false,

      code:
        "REQUEST_FAILED",

      message:
        "ไม่สามารถติดต่อระบบรับงานได้",
    };
  }
}

/**
 * ยกเลิกงาน
 *
 * POST /api/porter/assignment/cancel
 */
export async function cancelPorterJob(
  input: {
    reqNo: string;
    staffNo: string;
  },
): Promise<PorterLiveActionResult> {
  try {
    const response =
      await fetch(
        "/api/porter/assignment/cancel",
        {
          method:
            "POST",

          cache:
            "no-store",

          headers: {
            "Content-Type":
              "application/json",

            "Cache-Control":
              "no-cache",
          },

          body:
            JSON.stringify(
              input,
            ),
        },
      );

    const body =
      await readJson(
        response,
      );

    if (
      response.ok
      && body.success
    ) {
      return {
        success:
          true,
      };
    }

    return {
      success:
        false,

      code:
        normalizeErrorCode(
          body.code,
        ),

      message:
        body.message
        ?? "ยกเลิกงานไม่สำเร็จ",

      assignment:
        body.assignment
        ?? undefined,
    };
  } catch (error) {
    console.error(
      "cancelPorterJob error:",
      error,
    );

    return {
      success:
        false,

      code:
        "REQUEST_FAILED",

      message:
        "ไม่สามารถติดต่อระบบรับงานได้",
    };
  }
}

/**
 * เสร็จสิ้นงาน
 *
 * POST /api/porter/assignment/finish
 */
export async function finishPorterJob(
  input: {
    reqNo: string;
    staffNo: string;
  },
): Promise<PorterLiveActionResult> {
  try {
    const response =
      await fetch(
        "/api/porter/assignment/finish",
        {
          method:
            "POST",

          cache:
            "no-store",

          headers: {
            "Content-Type":
              "application/json",

            "Cache-Control":
              "no-cache",
          },

          body:
            JSON.stringify(
              input,
            ),
        },
      );

    const body =
      await readJson(
        response,
      );

    if (
      response.ok
      && body.success
    ) {
      return {
        success:
          true,
      };
    }

    return {
      success:
        false,

      code:
        normalizeErrorCode(
          body.code,
        ),

      message:
        body.message
        ?? "บันทึกเสร็จสิ้นงานไม่สำเร็จ",

      assignment:
        body.assignment
        ?? undefined,
    };
  } catch (error) {
    console.error(
      "finishPorterJob error:",
      error,
    );

    return {
      success:
        false,

      code:
        "REQUEST_FAILED",

      message:
        "ไม่สามารถติดต่อระบบรับงานได้",
    };
  }
}