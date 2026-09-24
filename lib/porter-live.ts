"use client";

import type { PorterJob } from "@/types/porter";

export type PorterLiveAssignment = {
  staffNo: string;
  staffName: string;
  assignedAt: string;
  jobs: PorterJob[];

  /**
   * เก็บไว้เพื่อรองรับโค้ดเก่าที่เรียก assignment.job
   * โดย job จะเป็นงานแรกใน jobs
   */
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
  | "HEAD_JOB_CANNOT_CANCEL"
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

type ApiAssignment = {
  staffNo?: string;
  staffName?: string;
  assignedAt?: string;

  /**
   * รูปแบบใหม่
   */
  jobs?: PorterJob[];

  /**
   * รูปแบบเก่า
   */
  job?: PorterJob;
};

type ApiBody = {
  success?: boolean;
  code?: string;
  message?: string;
  assignment?: ApiAssignment | null;
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
    case "HEAD_JOB_CANNOT_CANCEL":
      return code;

    default:
      return "REQUEST_FAILED";
  }
}

/**
 * แปลง assignment จาก API
 *
 * รองรับทั้ง
 *
 * แบบเก่า:
 * {
 *   job: {...}
 * }
 *
 * และแบบใหม่:
 * {
 *   jobs: [{...}, {...}]
 * }
 */
function normalizeAssignment(
  assignment:
    | ApiAssignment
    | null
    | undefined,
): PorterLiveAssignment | null {
  if (!assignment) {
    return null;
  }

  let jobs: PorterJob[] = [];

  if (
    Array.isArray(
      assignment.jobs,
    )
  ) {
    jobs = assignment.jobs.filter(
      (
        item,
      ): item is PorterJob =>
        !!item &&
        typeof item.reqNo ===
          "string",
    );
  }

  if (
    jobs.length === 0 &&
    assignment.job
  ) {
    jobs = [
      assignment.job,
    ];
  }

  if (jobs.length === 0) {
    return null;
  }

  return {
    staffNo:
      String(
        assignment.staffNo ??
          "",
      ).trim(),

    staffName:
      String(
        assignment.staffName ??
          "",
      ).trim(),

    assignedAt:
      String(
        assignment.assignedAt ??
          jobs[0]?.assignedAt ??
          "",
      ).trim(),

    jobs,

    /**
     * รองรับโค้ดเก่า
     * assignment.job
     */
    job: jobs[0],
  };
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
      body.message ??
        "โหลดงานปัจจุบันไม่สำเร็จ",
    );
  }

  return normalizeAssignment(
    body.assignment,
  );
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

    const assignment =
      normalizeAssignment(
        body.assignment,
      );

    if (
      response.ok &&
      body.success
    ) {
      return {
        success:
          true,

        assignment:
          assignment ??
          undefined,
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
        body.message ??
        "รับงานไม่สำเร็จ",

      assignment:
        assignment ??
        undefined,
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

    const assignment =
      normalizeAssignment(
        body.assignment,
      );

    if (
      response.ok &&
      body.success
    ) {
      return {
        success:
          true,

        assignment:
          assignment ??
          undefined,
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
        body.message ??
        "ยกเลิกงานไม่สำเร็จ",

      assignment:
        assignment ??
        undefined,
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

    const assignment =
      normalizeAssignment(
        body.assignment,
      );

    if (
      response.ok &&
      body.success
    ) {
      return {
        success:
          true,

        assignment:
          assignment ??
          undefined,
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
        body.message ??
        "บันทึกเสร็จสิ้นงานไม่สำเร็จ",

      assignment:
        assignment ??
        undefined,
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