import "server-only";

import * as sql from "mssql";

import { getDb } from "@/lib/db";
import type { PorterJob } from "@/types/porter";

/**
 * รูปแบบข้อมูลที่ได้จาก SQL Server
 */
type PorterDbRow = {
  ReqNo?: unknown;
  LocSource?: unknown;
  LocDest?: unknown;
  LocAct?: unknown;
  Shift?: unknown;
  BedType?: unknown;
  FastTrack?: unknown;
  Remark?: unknown;
  Equipment?: unknown;

  // เพิ่ม Detail
  Detail?: unknown;

  CreatedAt?: Date | string | null;
  CreatedBy?: unknown;
  Status?: unknown;
  CurrentProc?: unknown;
  BedNo?: unknown;
  CradleStaffNo?: unknown;
  AssignedAt?: Date | string | null;
  FinishedAt?: Date | string | null;
};

/**
 * แปลงค่า CradleMst.FastTrack
 *
 * 0 = ปกติ
 * 1 = ด่วน
 * 2 = FastTrack
 */
function getFastTrackText(
  value: string | number | null | undefined,
): string {
  const fastTrack = String(
    value ?? "0",
  ).trim();

  switch (fastTrack) {
    case "1":
      return "ด่วน (ภายใน 15 นาที)";

    case "2":
      return "FastTrack (ทันที)";

    case "0":
    default:
      return "ปกติ (ภายใน 25 นาที)";
  }
}

/**
 * แปลงค่าเป็นข้อความ
 */
function getText(
  value: unknown,
  fallback = "-",
): string {
  if (
    value === null
    || value === undefined
  ) {
    return fallback;
  }

  const text = String(value).trim();

  return text || fallback;
}

/**
 * แปลงค่าเป็นข้อความที่ยอมให้เป็น null
 */
function getNullableText(
  value: unknown,
): string | null {
  if (
    value === null
    || value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

/**
 * แปลงค่าเป็น Date
 */
function parseDate(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

/**
 * รูปแบบวันที่ภาษาไทยสำหรับหน้ารายละเอียด
 *
 * ตัวอย่าง:
 * 6 สิงหาคม 2569 10:39
 *
 * หมายเหตุ:
 * ใช้ UTC getter เพื่อป้องกันเวลาจาก SQL Server
 * ถูกบวกเพิ่มอีก 7 ชั่วโมง
 */
function formatThaiDateTime(
  value: Date | string | null | undefined,
): string {
  const date = parseDate(value);

  if (!date) {
    return "-";
  }

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const day =
    date.getUTCDate();

  const month =
    thaiMonths[
      date.getUTCMonth()
    ];

  const year =
    date.getUTCFullYear() + 543;

  const hour = String(
    date.getUTCHours(),
  ).padStart(2, "0");

  const minute = String(
    date.getUTCMinutes(),
  ).padStart(2, "0");

  return (
    `${day} ${month} ${year} `
    + `${hour}:${minute}`
  );
}

/**
 * รูปแบบวันที่เต็มสำหรับ AssignedAt และ FinishedAt
 *
 * ตัวอย่าง:
 * 06/08/2569 10:39:14
 */
function formatDateTime(
  value: Date | string | null | undefined,
): string {
  const date = parseDate(value);

  if (!date) {
    return "-";
  }

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const year =
    date.getUTCFullYear() + 543;

  const hour = String(
    date.getUTCHours(),
  ).padStart(2, "0");

  const minute = String(
    date.getUTCMinutes(),
  ).padStart(2, "0");

  const second = String(
    date.getUTCSeconds(),
  ).padStart(2, "0");

  return (
    `${day}/${month}/${year} `
    + `${hour}:${minute}:${second}`
  );
}

/**
 * รูปแบบเวลาสำหรับหน้า Dashboard
 *
 * ตัวอย่าง:
 * 10:39
 */
function formatDateTimeShort(
  value: Date | string | null | undefined,
): string {
  const date = parseDate(value);

  if (!date) {
    return "-";
  }

  const hour = String(
    date.getUTCHours(),
  ).padStart(2, "0");

  const minute = String(
    date.getUTCMinutes(),
  ).padStart(2, "0");

  return `${hour}:${minute}`;
}

/**
 * แปลงข้อมูลจาก SQL Server เป็น PorterJob
 */
function mapPorterJob(
  row: PorterDbRow,
): PorterJob {
  const fastTrack =
    getText(
      row.FastTrack,
      "0",
    );

  return {
    reqNo:
      getText(
        row.ReqNo,
        "",
      ),

    locSource:
      getText(
        row.LocSource,
      ),

    locDest:
      getText(
        row.LocDest,
      ),

    locAct:
      getText(
        row.LocAct,
      ),

    shift:
      getText(
        row.Shift,
      ),

    bedType:
      getText(
        row.BedType,
      ),

    fastTrack,

    fastTrackText:
      getFastTrackText(
        fastTrack,
      ),

    remark:
      getText(
        row.Remark,
      ),

    equipment:
      getText(
        row.Equipment,
      ),

    /**
     * Detail จาก CradleMst.Detail
     * แยกออกจาก Equipment แล้ว
     */
    detail:
      getText(
        row.Detail,
      ),

    createdAt:
      formatThaiDateTime(
        row.CreatedAt,
      ),

    createdAtShort:
      formatDateTimeShort(
        row.CreatedAt,
      ),

    createdBy:
      getText(
        row.CreatedBy,
      ),

    status:
      getText(
        row.Status,
      ),

    currentProc:
      getText(
        row.CurrentProc,
      ),

    bedNo:
      getText(
        row.BedNo,
      ),

    cradleStaffNo:
      getNullableText(
        row.CradleStaffNo,
      ),

    assignedAt:
      row.AssignedAt
        ? formatDateTime(
            row.AssignedAt,
          )
        : null,

    finishedAt:
      row.FinishedAt
        ? formatDateTime(
            row.FinishedAt,
          )
        : null,
  };
}

/**
 * รายชื่อคอลัมน์ที่ใช้ร่วมกัน
 * ระหว่างงานรอรับและงานเสร็จสิ้น
 */
const porterSelectColumns = `
    C.ReqNo,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(SW.WardName)),
            ''
        ),
        ISNULL(
            NULLIF(
                LTRIM(RTRIM(C.LocSource)),
                ''
            ),
            '-'
        )
    ) AS LocSource,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.LocDest)),
            ''
        ),
        '-'
    ) AS LocDest,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.LocAct)),
            ''
        ),
        '-'
    ) AS LocAct,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.Shift)),
            ''
        ),
        '-'
    ) AS Shift,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.BedType)),
            ''
        ),
        '-'
    ) AS BedType,

    ISNULL(
        NULLIF(
            LTRIM(
                RTRIM(
                    CONVERT(
                        varchar(10),
                        C.FastTrack
                    )
                )
            ),
            ''
        ),
        '0'
    ) AS FastTrack,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.Remark)),
            ''
        ),
        '-'
    ) AS Remark,

    /*
     * Equipment แสดงเฉพาะ C.Equipment
     * ไม่เอา C.Detail มาต่อแล้ว
     */
    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.Equipment)),
            ''
        ),
        '-'
    ) AS Equipment,

    /*
     * Detail แยกเป็นอีกช่อง
     */
    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.Detail)),
            ''
        ),
        '-'
    ) AS Detail,

    C.crt_dt AS CreatedAt,

    ISNULL(
        NULLIF(
            LTRIM(
                RTRIM(
                    CONVERT(
                        nvarchar(250),
                        dbo.GetPyrextFullNameWithTitle(
                            C.crt_user
                        )
                    )
                )
            ),
            ''
        ),
        ISNULL(
            NULLIF(
                LTRIM(RTRIM(C.crt_user)),
                ''
            ),
            '-'
        )
    ) AS CreatedBy,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.Status)),
            ''
        ),
        '-'
    ) AS Status,

    ISNULL(
        NULLIF(
            LTRIM(
                RTRIM(
                    CONVERT(
                        varchar(20),
                        C.CurrentProc
                    )
                )
            ),
            ''
        ),
        '-'
    ) AS CurrentProc,

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.BEDNO)),
            ''
        ),
        '-'
    ) AS BedNo,

    C.CradleStaffNo,
    C.Ass_dt AS AssignedAt,
    C.fin_dt AS FinishedAt
`;

/**
 * ดึงชื่อพนักงานผู้ใช้งานระบบ
 */
export async function getStaffDisplayName(
  staffNo: string,
): Promise<string> {
  const normalizedStaffNo =
    String(
      staffNo ?? "",
    ).trim();

  if (!normalizedStaffNo) {
    return "";
  }

  const pool = await getDb();

  const result = await pool
    .request()
    .input(
      "StaffNo",
      sql.VarChar(30),
      normalizedStaffNo,
    )
    .query(`
      SELECT TOP 1
          dbo.GetPyrextFullNameWithTitle(
              PAYROLLNO
          ) AS StaffName
      FROM PYREXT
      WHERE PAYROLLNO = @StaffNo;
    `);

  const staffName =
    result.recordset[0]?.StaffName;

  if (
    staffName === null
    || staffName === undefined
  ) {
    return "";
  }

  return String(
    staffName,
  ).trim();
}

/**
 * ดึงรายการงานรอรับของวันปัจจุบัน
 */
export async function getWaitingJobs(): Promise<
  PorterJob[]
> {
  const pool = await getDb();

  const result = await pool
    .request()
    .query(`
      SELECT
          ${porterSelectColumns}

      FROM CradleMst C

      LEFT JOIN dbo.wardcode SW
          ON C.LocSource = SW.Code

      WHERE LTRIM(RTRIM(C.Status))
          = N'ยังไม่ดำเนินการ'

        AND C.crt_dt >= CONVERT(
            date,
            GETDATE()
        )

        AND C.crt_dt < DATEADD(
            DAY,
            1,
            CONVERT(
                date,
                GETDATE()
            )
        )

        AND C.fin_dt IS NULL

        AND
        (
            C.CradleStaffNo IS NULL

            OR LTRIM(
                RTRIM(
                    C.CradleStaffNo
                )
            ) = ''
        )

      ORDER BY
          CASE
              WHEN ISNULL(
                  CONVERT(
                      varchar(10),
                      C.FastTrack
                  ),
                  '0'
              ) = '2'
              THEN 1

              WHEN ISNULL(
                  CONVERT(
                      varchar(10),
                      C.FastTrack
                  ),
                  '0'
              ) = '1'
              THEN 2

              ELSE 3
          END,

          C.crt_dt DESC,
          C.ReqNo DESC;
    `);

  return result.recordset.map(
    (row) =>
      mapPorterJob(
        row as PorterDbRow,
      ),
  );
}

/**
 * ดึงงานเสร็จสิ้นของวันปัจจุบัน
 * เฉพาะพนักงานที่เข้าสู่ระบบ
 */
export async function getFinishedJobs(
  staffNo: string,
): Promise<PorterJob[]> {
  const normalizedStaffNo =
    String(
      staffNo ?? "",
    ).trim();

  if (!normalizedStaffNo) {
    return [];
  }

  const pool = await getDb();

  const result = await pool
    .request()
    .input(
      "StaffNo",
      sql.VarChar(30),
      normalizedStaffNo,
    )
    .query(`
      SELECT
          ${porterSelectColumns}

      FROM CradleMst C

      LEFT JOIN dbo.wardcode SW
          ON C.LocSource = SW.Code

      WHERE LTRIM(RTRIM(C.Status))
          = N'เสร็จสิ้น'

        AND LTRIM(
            RTRIM(
                ISNULL(
                    C.CradleStaffNo,
                    ''
                )
            )
        ) = @StaffNo

        AND C.fin_dt >= CONVERT(
            date,
            GETDATE()
        )

        AND C.fin_dt < DATEADD(
            DAY,
            1,
            CONVERT(
                date,
                GETDATE()
            )
        )

      ORDER BY
          C.fin_dt DESC,
          C.crt_dt DESC;
    `);

  return result.recordset.map(
    (row) =>
      mapPorterJob(
        row as PorterDbRow,
      ),
  );
}

/* ============================================================
 * งานจริง: รับงาน / งานปัจจุบัน / ยกเลิก / เสร็จสิ้น
 * ============================================================ */

export type PorterLiveAssignment = {
  staffNo: string;
  staffName: string;
  assignedAt: string;
  job: PorterJob;
};

export type PorterLiveActionCode =
  | "ALREADY_ASSIGNED"
  | "ALREADY_FINISHED"
  | "STAFF_HAS_ACTIVE_JOB"
  | "NOT_FOUND"
  | "NOT_OWNER"
  | "NOT_ACTIVE"
  | "INVALID_INPUT"
  | "DATABASE_ERROR";

export type PorterLiveActionResult =
  | {
      success: true;
      assignment?: PorterLiveAssignment;
    }
  | {
      success: false;
      code: PorterLiveActionCode;
      message: string;
      assignment?: PorterLiveAssignment;
    };

function normalizeCode(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/**
 * ดึงงานที่พนักงานคนนี้กำลังดำเนินการอยู่
 */
export async function getCurrentPorterJob(
  staffNo: string,
): Promise<PorterJob | null> {
  const normalizedStaffNo =
    normalizeCode(
      staffNo,
    );

  if (!normalizedStaffNo) {
    return null;
  }

  const pool =
    await getDb();

  const result =
    await pool
      .request()
      .input(
        "StaffNo",
        sql.VarChar(30),
        normalizedStaffNo,
      )
      .query(`
        SELECT TOP 1
            ${porterSelectColumns}

        FROM CradleMst C

        LEFT JOIN dbo.wardcode SW
            ON C.LocSource = SW.Code

        WHERE LTRIM(
            RTRIM(
                ISNULL(
                    C.CradleStaffNo,
                    ''
                )
            )
        ) = @StaffNo

          AND LTRIM(
              RTRIM(
                  ISNULL(
                      C.Status,
                      ''
                  )
              )
          ) = N'กำลังดำเนินการ'

          AND ISNULL(
              C.CurrentProc,
              0
          ) = 20

          AND C.fin_dt IS NULL

          /*
           * แสดงเฉพาะงานที่รับในวันปัจจุบัน
           */
          AND C.Ass_dt >= CONVERT(
              date,
              GETDATE()
          )

          AND C.Ass_dt < DATEADD(
              DAY,
              1,
              CONVERT(
                  date,
                  GETDATE()
              )
          )

        ORDER BY
            C.Ass_dt DESC,
            C.crt_dt DESC;
      `);

  const row =
    result.recordset[0];

  if (!row) {
    return null;
  }

  return mapPorterJob(
    row as PorterDbRow,
  );
}

export async function getCurrentPorterAssignment(
  staffNo: string,
): Promise<PorterLiveAssignment | null> {
  const normalizedStaffNo =
    normalizeCode(
      staffNo,
    );

  if (!normalizedStaffNo) {
    return null;
  }

  const job =
    await getCurrentPorterJob(
      normalizedStaffNo,
    );

  if (!job) {
    return null;
  }

  const staffName =
    await getStaffDisplayName(
      normalizedStaffNo,
    );

  return {
    staffNo:
      normalizedStaffNo,

    staffName,

    assignedAt:
      job.assignedAt
      ?? "",

    job,
  };
}

/**
 * รับงานจริง
 */
export async function acceptPorterJobDb(
  reqNo: string,
  staffNo: string,
): Promise<PorterLiveActionResult> {
  const normalizedReqNo =
    normalizeCode(
      reqNo,
    );

  const normalizedStaffNo =
    normalizeCode(
      staffNo,
    );

  if (
    !normalizedReqNo
    || !normalizedStaffNo
  ) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "ไม่พบรหัสงานหรือรหัสพนักงาน",
    };
  }

  const pool =
    await getDb();

  const transaction =
    new sql.Transaction(
      pool,
    );

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE,
    );

    const activeResult =
  await transaction
    .request()
    .input(
      "StaffNo",
      sql.VarChar(30),
      normalizedStaffNo,
    )
    .query(`
      SELECT TOP 1
          C.ReqNo

      FROM CradleMst C
          WITH (
              UPDLOCK,
              HOLDLOCK
          )

      WHERE LTRIM(
          RTRIM(
              ISNULL(
                  C.CradleStaffNo,
                  ''
              )
          )
      ) = @StaffNo

        AND LTRIM(
            RTRIM(
                ISNULL(
                    C.Status,
                    ''
                )
            )
        ) = N'กำลังดำเนินการ'

        AND ISNULL(
            C.CurrentProc,
            0
        ) = 20

        AND C.fin_dt IS NULL

        /*
         * เช็กเฉพาะงานที่รับในวันปัจจุบัน
         * งานเก่าวันก่อนจะไม่ขวางการรับงานวันนี้
         */
        AND C.Ass_dt >= CONVERT(
            date,
            GETDATE()
        )

        AND C.Ass_dt < DATEADD(
            DAY,
            1,
            CONVERT(
                date,
                GETDATE()
            )
        )

      ORDER BY
          C.Ass_dt DESC;
    `);

    const activeReqNo =
      normalizeCode(
        activeResult
          .recordset[0]
          ?.ReqNo,
      );

    if (
      activeReqNo
      && activeReqNo
        !== normalizedReqNo
    ) {
      await transaction.rollback();

      const assignment =
        await getCurrentPorterAssignment(
          normalizedStaffNo,
        );

      return {
        success: false,
        code:
          "STAFF_HAS_ACTIVE_JOB",
        message:
          `มีงาน ${activeReqNo} กำลังดำเนินการอยู่`,
        assignment:
          assignment ?? undefined,
      };
    }

    const targetResult =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          normalizedReqNo,
        )
        .query(`
          SELECT TOP 1
              C.ReqNo,
              C.Status,
              C.CurrentProc,
              C.CradleStaffNo,
              C.Ass_dt,
              C.fin_dt

          FROM CradleMst C
              WITH (
                  UPDLOCK,
                  HOLDLOCK
              )

          WHERE C.ReqNo = @ReqNo;
        `);

    const target =
      targetResult
        .recordset[0];

    if (!target) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_FOUND",
        message:
          "ไม่พบรายการงานนี้ในฐานข้อมูล",
      };
    }

    const targetStatus =
      normalizeCode(
        target.Status,
      );

    const targetStaffNo =
      normalizeCode(
        target.CradleStaffNo,
      );

    const targetCurrentProc =
      Number(
        target.CurrentProc
        ?? 0,
      );

    if (
      target.fin_dt
      || targetStatus
        === "เสร็จสิ้น"
      || targetCurrentProc
        === 30
    ) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "ALREADY_FINISHED",
        message:
          "งานนี้เสร็จสิ้นแล้ว ไม่สามารถรับซ้ำได้",
      };
    }

    if (
      targetStaffNo
        === normalizedStaffNo
      && targetStatus
        === "กำลังดำเนินการ"
      && targetCurrentProc
        === 20
    ) {
      await transaction.commit();

      try {
        const assignment =
          await getCurrentPorterAssignment(
            normalizedStaffNo,
          );

        return {
          success: true,
          assignment:
            assignment ?? undefined,
        };
      } catch (assignmentError) {
        console.error(
          "Load assignment after accept error:",
          assignmentError,
        );

        return {
          success: true,
        };
      }
    }

    if (targetStaffNo) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "ALREADY_ASSIGNED",
        message:
          "มีพนักงานคนอื่นรับงานนี้ไปก่อนแล้ว",
      };
    }

    if (
      targetStatus
        !== "ยังไม่ดำเนินการ"
    ) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_ACTIVE",
        message:
          "สถานะของงานถูกเปลี่ยนแล้ว กรุณาโหลดรายการใหม่",
      };
    }

    const updateResult =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          normalizedReqNo,
        )
        .input(
          "StaffNo",
          sql.VarChar(30),
          normalizedStaffNo,
        )
        .query(`
          UPDATE CradleMst
          SET
              CradleStaffNo =
                  @StaffNo,

              Ass_dt =
                  GETDATE(),

              fin_dt =
                  NULL,

              Status =
                  N'กำลังดำเนินการ',

              CurrentProc =
                  20

          WHERE ReqNo =
              @ReqNo

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        Status,
                        ''
                    )
                )
            ) = N'ยังไม่ดำเนินการ'

            AND fin_dt IS NULL

            AND (
                CradleStaffNo IS NULL

                OR LTRIM(
                    RTRIM(
                        CradleStaffNo
                    )
                ) = ''
            );
        `);

    const affected =
      updateResult
        .rowsAffected[0]
      ?? 0;

    if (affected !== 1) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "ALREADY_ASSIGNED",
        message:
          "มีพนักงานคนอื่นรับงานนี้ไปก่อนแล้ว",
      };
    }

    await transaction.commit();

    try {
      const assignment =
        await getCurrentPorterAssignment(
          normalizedStaffNo,
        );

      return {
        success: true,
        assignment:
          assignment ?? undefined,
      };
    } catch (assignmentError) {
      console.error(
        "Load assignment after accept error:",
        assignmentError,
      );

      return {
        success: true,
      };
    }
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      //
    }

    console.error(
      "acceptPorterJobDb error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        "รับงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * ยกเลิกงานจริง
 */
export async function cancelPorterJobDb(
  reqNo: string,
  staffNo: string,
): Promise<PorterLiveActionResult> {
  const normalizedReqNo =
    normalizeCode(
      reqNo,
    );

  const normalizedStaffNo =
    normalizeCode(
      staffNo,
    );

  if (
    !normalizedReqNo
    || !normalizedStaffNo
  ) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "ไม่พบรหัสงานหรือรหัสพนักงาน",
    };
  }

  const pool =
    await getDb();

  const transaction =
    new sql.Transaction(
      pool,
    );

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE,
    );

    const targetResult =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          normalizedReqNo,
        )
        .query(`
          SELECT TOP 1
              C.Status,
              C.CurrentProc,
              C.CradleStaffNo,
              C.fin_dt

          FROM CradleMst C
              WITH (
                  UPDLOCK,
                  HOLDLOCK
              )

          WHERE C.ReqNo =
              @ReqNo;
        `);

    const target =
      targetResult
        .recordset[0];

    if (!target) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_FOUND",
        message:
          "ไม่พบรายการงานนี้",
      };
    }

    const targetStaffNo =
      normalizeCode(
        target.CradleStaffNo,
      );

    const targetStatus =
      normalizeCode(
        target.Status,
      );

    if (
      target.fin_dt
      || targetStatus
        === "เสร็จสิ้น"
    ) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "ALREADY_FINISHED",
        message:
          "งานนี้เสร็จสิ้นแล้ว ไม่สามารถยกเลิกได้",
      };
    }

    if (
      targetStaffNo
        !== normalizedStaffNo
    ) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_OWNER",
        message:
          "งานนี้ไม่ได้อยู่ในความรับผิดชอบของผู้ใช้งานปัจจุบัน",
      };
    }

    const result =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          normalizedReqNo,
        )
        .input(
          "StaffNo",
          sql.VarChar(30),
          normalizedStaffNo,
        )
        .query(`
          UPDATE CradleMst
          SET
              CradleStaffNo =
                  NULL,

              Ass_dt =
                  NULL,

              fin_dt =
                  NULL,

              Status =
                  N'ยังไม่ดำเนินการ',

              CurrentProc =
                  10

          WHERE ReqNo =
              @ReqNo

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        CradleStaffNo,
                        ''
                    )
                )
            ) = @StaffNo

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        Status,
                        ''
                    )
                )
            ) = N'กำลังดำเนินการ'

            AND ISNULL(
                CurrentProc,
                0
            ) = 20

            AND fin_dt IS NULL;
        `);

    const affected =
      result.rowsAffected[0]
      ?? 0;

    if (affected !== 1) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_ACTIVE",
        message:
          "สถานะงานถูกเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่",
      };
    }

    await transaction.commit();

    return {
      success: true,
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      //
    }

    console.error(
      "cancelPorterJobDb error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        "ยกเลิกงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * เสร็จสิ้นงานจริง
 */
export async function finishPorterJobDb(
  reqNo: string,
  staffNo: string,
): Promise<PorterLiveActionResult> {
  const normalizedReqNo =
    normalizeCode(
      reqNo,
    );

  const normalizedStaffNo =
    normalizeCode(
      staffNo,
    );

  if (
    !normalizedReqNo
    || !normalizedStaffNo
  ) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "ไม่พบรหัสงานหรือรหัสพนักงาน",
    };
  }

  const pool =
    await getDb();

  const transaction =
    new sql.Transaction(
      pool,
    );

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE,
    );

    const targetResult =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          normalizedReqNo,
        )
        .query(`
          SELECT TOP 1
              C.Status,
              C.CurrentProc,
              C.CradleStaffNo,
              C.fin_dt

          FROM CradleMst C
              WITH (
                  UPDLOCK,
                  HOLDLOCK
              )

          WHERE C.ReqNo =
              @ReqNo;
        `);

    const target =
      targetResult
        .recordset[0];

    if (!target) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_FOUND",
        message:
          "ไม่พบรายการงานนี้",
      };
    }

    const targetStaffNo =
      normalizeCode(
        target.CradleStaffNo,
      );

    const targetStatus =
      normalizeCode(
        target.Status,
      );

    if (
      target.fin_dt
      || targetStatus
        === "เสร็จสิ้น"
    ) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "ALREADY_FINISHED",
        message:
          "งานนี้ถูกบันทึกเสร็จสิ้นแล้ว",
      };
    }

    if (
      targetStaffNo
        !== normalizedStaffNo
    ) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_OWNER",
        message:
          "งานนี้ไม่ได้อยู่ในความรับผิดชอบของผู้ใช้งานปัจจุบัน",
      };
    }

    const result =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          normalizedReqNo,
        )
        .input(
          "StaffNo",
          sql.VarChar(30),
          normalizedStaffNo,
        )
        .query(`
          UPDATE CradleMst
          SET
              fin_dt =
                  GETDATE(),

              Status =
                  N'เสร็จสิ้น',

              CurrentProc =
                  30

          WHERE ReqNo =
              @ReqNo

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        CradleStaffNo,
                        ''
                    )
                )
            ) = @StaffNo

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        Status,
                        ''
                    )
                )
            ) = N'กำลังดำเนินการ'

            AND ISNULL(
                CurrentProc,
                0
            ) = 20

            AND fin_dt IS NULL;
        `);

    const affected =
      result.rowsAffected[0]
      ?? 0;

    if (affected !== 1) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_ACTIVE",
        message:
          "สถานะงานถูกเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่",
      };
    }

    await transaction.commit();

    return {
      success: true,
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      //
    }

    console.error(
      "finishPorterJobDb error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        "บันทึกเสร็จสิ้นงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}