import "server-only";

import * as sql from "mssql";

import { getDb } from "@/lib/db";
import type { PorterJob } from "@/types/porter";

/**
 * รูปแบบข้อมูลที่ได้จาก SQL Server
 */
type PorterDbRow = {
  ReqNo?: unknown;
  Porter?: unknown;
  IsHeadJob?: unknown;
  PorterWard?: unknown;
  LocSource?: unknown;
  LocDest?: unknown;
  LocAct?: unknown;
  Shift?: unknown;
  BedType?: unknown;
  FastTrack?: unknown;
  Remark?: unknown;
  Equipment?: unknown;
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
    value === null ||
    value === undefined
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
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

/**
 * แปลงค่าเป็น Boolean
 */
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
    `${day} ${month} ${year} ` +
    `${hour}:${minute}`
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
    `${day}/${month}/${year} ` +
    `${hour}:${minute}:${second}`
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
 * แปลงประเภทศูนย์เปล
 *
 * porter = 1
 *   = OPD
 *
 * porter = 2
 *   = ER
 *
 * porter = 4
 *   = ER
 *   ยกเว้น Ward 114 = OPD
 */
function getPorterType(
  porter: string,
  ward: string,
): "ER" | "OPD" {
  if (porter === "2") {
    return "ER";
  }

  if (
    porter === "4" &&
    ward !== "114"
  ) {
    return "ER";
  }

  return "OPD";
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

  const porter =
    getText(
      row.Porter,
      "0",
    );

  const porterWard =
    getText(
      row.PorterWard,
      "",
    );

  const porterType =
    getPorterType(
      porter,
      porterWard,
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

    porter,

    porterType,

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

    isHeadJob:
      getBoolean(
        row.IsHeadJob,
      ),
  };
}

/**
 * รายชื่อคอลัมน์ที่ใช้ร่วมกัน
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
            LTRIM(RTRIM(WS.Ward)),
            ''
        ),
        '-'
    ) AS PorterWard,

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

    ISNULL(
        NULLIF(
            LTRIM(RTRIM(C.Equipment)),
            ''
        ),
        '-'
    ) AS Equipment,

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

    C.fin_dt AS FinishedAt,

    CASE
        WHEN LTRIM(
            RTRIM(
                ISNULL(
                    C.crt_user,
                    ''
                )
            )
        ) =
        LTRIM(
            RTRIM(
                ISNULL(
                    CASE
                        WHEN C.Shift = N'เช้า'
                            THEN H.HeadAMNo

                        WHEN C.Shift = N'บ่าย'
                            THEN H.HeadPMNo

                        WHEN C.Shift = N'ดึก'
                            THEN H.HeadNightNo

                        ELSE NULL
                    END,
                    ''
                )
            )
        )
        THEN CAST(1 AS bit)

        ELSE CAST(0 AS bit)
    END AS IsHeadJob,

    ISNULL(
        NULLIF(
            LTRIM(
                RTRIM(
                    CONVERT(
                        varchar(10),
                        WS.porter
                    )
                )
            ),
            ''
        ),
        '0'
    ) AS Porter
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
    staffName === null ||
    staffName === undefined
  ) {
    return "";
  }

  return String(
    staffName,
  ).trim();
}

/**
 * ศูนย์เปล
 */
export type PorterCenter =
  | "ศูนย์เปล ER"
  | "ศูนย์เปล OPD";

/**
 * ดึงรายการงานรอรับของวันปัจจุบัน
 */
export async function getWaitingJobs(
  center: PorterCenter,
): Promise<PorterJob[]> {
  const pool = await getDb();

  const porterCondition =
    center === "ศูนย์เปล OPD"
      ? `
        LTRIM(
            RTRIM(
                ISNULL(
                    CONVERT(
                        varchar(10),
                        WS.porter
                    ),
                    ''
                )
            )
        ) = '1'

        OR (
            LTRIM(
                RTRIM(
                    ISNULL(
                        CONVERT(
                            varchar(10),
                            WS.porter
                        ),
                        ''
                    )
                )
            ) = '4'

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        WS.Ward,
                        ''
                    )
                )
            ) = '114'
        )
      `
      : `
        LTRIM(
            RTRIM(
                ISNULL(
                    CONVERT(
                        varchar(10),
                        WS.porter
                    ),
                    ''
                )
            )
        ) = '2'

        OR (
            LTRIM(
                RTRIM(
                    ISNULL(
                        CONVERT(
                            varchar(10),
                            WS.porter
                        ),
                        ''
                    )
                )
            ) = '4'

            AND LTRIM(
                RTRIM(
                    ISNULL(
                        WS.Ward,
                        ''
                    )
                )
            ) <> '114'
        )
      `;

  const result = await pool
    .request()
    .query(`
      SELECT
          ${porterSelectColumns}

      FROM CradleMst C

      LEFT JOIN dbo.wardcode SW
          ON C.LocSource = SW.Code

      LEFT JOIN dbo.WardSection WS
          ON C.LocSource = WS.Ward

      LEFT JOIN dbo.CradleMstRef_Head H
          ON H.CradleDate =
             CONVERT(
                 date,
                 C.crt_dt
             )

      WHERE LTRIM(
          RTRIM(
              ISNULL(
                  C.Status,
                  ''
              )
          )
      ) = N'ยังไม่ดำเนินการ'

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

        AND (
            C.CradleStaffNo IS NULL
            OR LTRIM(
                RTRIM(
                    C.CradleStaffNo
                )
            ) = ''
        )

        AND (
            ${porterCondition}
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
 * ดึงรายการงานที่เสร็จสิ้นของวันนี้
 */
export async function getFinishedJobs(
  staffNo: string,
): Promise<PorterJob[]> {
  const normalizedStaffNo =
    normalizeCode(staffNo);

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

      LEFT JOIN dbo.WardSection WS
          ON C.LocSource = WS.Ward

      LEFT JOIN dbo.CradleMstRef_Head H
          ON H.CradleDate =
             CONVERT(
                 date,
                 C.crt_dt
             )

      WHERE LTRIM(
          RTRIM(
              ISNULL(
                  C.Status,
                  ''
              )
          )
      ) = N'เสร็จสิ้น'

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

/* ============================================================
 * งานจริง:
 * รับงาน / งานปัจจุบัน / ยกเลิก / เสร็จสิ้น
 * ============================================================ */

export type PorterLiveAssignment = {
  staffNo: string;
  staffName: string;
  assignedAt: string;
  jobs: PorterJob[];
};

export type PorterLiveActionCode =
  | "ALREADY_ASSIGNED"
  | "ALREADY_FINISHED"
  | "STAFF_HAS_ACTIVE_JOB"
  | "NOT_FOUND"
  | "NOT_OWNER"
  | "NOT_ACTIVE"
  | "HEAD_JOB_CANNOT_CANCEL"
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
 * ดึงงานปัจจุบันทั้งหมด
 *
 * พนักงาน 1 คนสามารถมีงานกำลังดำเนินการหลายงานได้
 *
 * เช่น
 *
 * A = รับเอง
 * B = หัวหน้ามอบหมาย
 * C = หัวหน้ามอบหมาย
 *
 * จึงห้ามใช้ TOP 1
 */
export async function getCurrentPorterJobs(
  staffNo: string,
): Promise<PorterJob[]> {
  const normalizedStaffNo =
    normalizeCode(staffNo);

  if (!normalizedStaffNo) {
    return [];
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
        SELECT
            ${porterSelectColumns}

        FROM CradleMst C

        LEFT JOIN dbo.wardcode SW
            ON C.LocSource = SW.Code

        LEFT JOIN dbo.WardSection WS
            ON C.LocSource = WS.Ward

        LEFT JOIN dbo.CradleMstRef_Head H
            ON H.CradleDate =
               CONVERT(
                   date,
                   C.crt_dt
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
            C.Ass_dt ASC,
            C.crt_dt ASC,
            C.ReqNo ASC;
      `);

  return result.recordset.map(
    (row) =>
      mapPorterJob(
        row as PorterDbRow,
      ),
  );
}

/**
 * ดึงงานปัจจุบันทั้งหมดพร้อมข้อมูลพนักงาน
 */
export async function getCurrentPorterAssignment(
  staffNo: string,
): Promise<PorterLiveAssignment | null> {
  const normalizedStaffNo =
    normalizeCode(staffNo);

  if (!normalizedStaffNo) {
    return null;
  }

  const jobs =
    await getCurrentPorterJobs(
      normalizedStaffNo,
    );

  if (
    jobs.length === 0
  ) {
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
      jobs[0]?.assignedAt
      ?? "",

    jobs,
  };
}

/**
 * ============================================================
 * ตรวจงานหัวหน้าที่มอบหมายเข้ามาใหม่
 * ============================================================
 */
export async function getPendingHeadJob(
  staffNo: string,
  excludeReqNos?: string[],
): Promise<PorterJob | null> {
  const normalizedStaffNo =
    normalizeCode(staffNo);

  if (!normalizedStaffNo) {
    return null;
  }

  const pool = await getDb();

    const request =
    pool
      .request()
      .input(
        "StaffNo",
        sql.VarChar(30),
        normalizedStaffNo,
      );

  const normalizedExcludes =
    (excludeReqNos ?? [])
      .map((r) => normalizeCode(r))
      .filter((r) => r);

  normalizedExcludes.forEach(
    (reqNo, index) => {
      request.input(
        `ExcludeReqNo${index}`,
        sql.VarChar(50),
        reqNo,
      );
    },
  );

  const result =
    await request.query(`
      SELECT TOP 1
          ${porterSelectColumns}

      FROM CradleMst C

      LEFT JOIN dbo.CradleMstRef_Head H
          ON H.CradleDate =
             CONVERT(
                 date,
                 C.crt_dt
             )

      LEFT JOIN dbo.wardcode SW
          ON C.LocSource = SW.Code

      LEFT JOIN dbo.WardSection WS
          ON C.LocSource = WS.Ward

      WHERE
          LTRIM(
              RTRIM(
                  ISNULL(
                      C.CradleStaffNo,
                      ''
                  )
              )
          ) = @StaffNo

        AND C.fin_dt IS NULL

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
       
        AND LTRIM(
            RTRIM(
                ISNULL(
                    C.Status,
                    ''
                )
            )
        ) <> N'เสร็จสิ้น'

        ${
          normalizedExcludes.length > 0
            ? `
        AND C.ReqNo NOT IN (${normalizedExcludes
          .map((_, index) => `@ExcludeReqNo${index}`)
          .join(", ")})
            `
            : ""
        }

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

          CASE
              WHEN C.Status = N'กำลังดำเนินการ'
              THEN 0
              ELSE 1
          END,

          C.Ass_dt ASC,

          C.crt_dt ASC,

          C.ReqNo ASC;
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

/**
 * ============================================================
 * Auto รับงานหัวหน้า
 *
 * ตอนนี้ยังคง logic เดิมไว้ก่อน
 * ============================================================
 */
export async function autoAssignHeadJob(
  staffNo: string,
): Promise<PorterLiveAssignment | null> {
  const normalizedStaffNo =
    normalizeCode(staffNo);

  if (!normalizedStaffNo) {
    return null;
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

    /**
     * ตรวจงาน Current
     */
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

    /**
     * ถ้ามี Current อยู่
     * ห้าม Auto รับงานใหม่
     *
     * หมายเหตุ:
     * ส่วนนี้ยังไม่ได้แก้ในรอบนี้
     */
    if (activeReqNo) {
      await transaction.rollback();

      return null;
    }

    /**
     * หางานหัวหน้าที่รออยู่
     */
    const headJobResult =
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

          LEFT JOIN dbo.CradleMstRef_Head H
              ON H.CradleDate =
                 CONVERT(
                     date,
                     C.crt_dt
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
            ) = N'ยังไม่ดำเนินการ'

            AND C.fin_dt IS NULL

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

              C.crt_dt ASC,

              C.ReqNo ASC;
        `);

    const headJob =
      headJobResult
        .recordset[0];

    /**
     * ไม่มีงานหัวหน้า
     */
    if (!headJob) {
      await transaction.commit();

      return null;
    }

    const reqNo =
      normalizeCode(
        headJob.ReqNo,
      );

    /**
     * เปลี่ยนเป็นกำลังดำเนินการ
     */
    const updateResult =
      await transaction
        .request()
        .input(
          "ReqNo",
          sql.VarChar(50),
          reqNo,
        )
        .input(
          "StaffNo",
          sql.VarChar(30),
          normalizedStaffNo,
        )
        .query(`
          UPDATE C

          SET
              C.Ass_dt =
                  GETDATE(),

              C.fin_dt =
                  NULL,

              C.Status =
                  N'กำลังดำเนินการ',

              C.CurrentProc =
                  20

          FROM CradleMst C

          LEFT JOIN dbo.CradleMstRef_Head H
              ON H.CradleDate =
                 CONVERT(
                     date,
                     C.crt_dt
                 )

          WHERE C.ReqNo =
              @ReqNo

            AND LTRIM(
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
            ) = N'ยังไม่ดำเนินการ'

            AND C.fin_dt IS NULL

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

            
        `);

    const affected =
      updateResult
        .rowsAffected[0]
      ?? 0;

    if (affected !== 1) {
      await transaction.rollback();

      return null;
    }

    await transaction.commit();

    /**
     * ดึงงานที่เพิ่ง Auto รับ
     */
    const assignment =
      await getCurrentPorterAssignment(
        normalizedStaffNo,
      );

    return assignment;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // ไม่ต้องทำอะไร
    }

    console.error(
      "autoAssignHeadJob error:",
      error,
    );

    return null;
  }
}

/**
 * ============================================================
 * รับงานจริง
 *
 * สำคัญ:
 *
 * พนักงานสามารถมีงานหลายงานพร้อมกันได้
 *
 * เช่น
 *
 * A = รับเอง
 * B = รับเพิ่ม
 * C = รับเพิ่ม
 *
 * ห้ามตรวจว่าพนักงานมี Current อยู่แล้ว
 * ============================================================
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
    !normalizedReqNo ||
    !normalizedStaffNo
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

    /**
     * ตรวจงานเป้าหมาย
     */
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

    /**
     * งานเสร็จแล้ว
     */
    if (
      target.fin_dt ||
      targetStatus === "เสร็จสิ้น" ||
      targetCurrentProc === 30
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

    /**
     * ถ้างานนี้เป็นของพนักงานคนนี้
     * และกำลังดำเนินการอยู่แล้ว
     *
     * ให้ถือว่ารับงานสำเร็จ
     * แล้วส่งรายการ Current ทั้งหมดกลับไป
     */
    if (
      targetStaffNo ===
        normalizedStaffNo &&
      targetStatus ===
        "กำลังดำเนินการ" &&
      targetCurrentProc === 20
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
            assignment
            ?? undefined,
        };
      } catch (
        assignmentError
      ) {
        console.error(
          "Load assignment after accept error:",
          assignmentError,
        );

        return {
          success: true,
        };
      }
    }

    /**
     * งานมีพนักงานคนอื่นรับไปแล้ว
     */
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

    /**
     * ต้องเป็นงานที่รอรับเท่านั้น
     */
    if (
      targetStatus !==
      "ยังไม่ดำเนินการ"
    ) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_ACTIVE",
        message:
          "สถานะของงานถูกเปลี่ยนแล้ว กรุณาโหลดรายการใหม่",
      };
    }

    /**
     * รับงาน
     */
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

    /**
     * ดึงงานปัจจุบันทั้งหมด
     *
     * ตรงนี้จะได้ A + B + C + D
     */
    try {
      const assignment =
        await getCurrentPorterAssignment(
          normalizedStaffNo,
        );

      return {
        success: true,
        assignment:
          assignment
          ?? undefined,
      };
    } catch (
      assignmentError
    ) {
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
      // ไม่ต้องทำอะไร
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
    !normalizedReqNo ||
    !normalizedStaffNo
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
              C.fin_dt,

              CASE
                  WHEN LTRIM(
                      RTRIM(
                          ISNULL(
                              C.crt_user,
                              ''
                          )
                      )
                  ) =
                  LTRIM(
                      RTRIM(
                          ISNULL(
                              CASE
                                  WHEN C.Shift = N'เช้า'
                                      THEN H.HeadAMNo

                                  WHEN C.Shift = N'บ่าย'
                                      THEN H.HeadPMNo

                                  WHEN C.Shift = N'ดึก'
                                      THEN H.HeadNightNo

                                  ELSE NULL
                              END,
                              ''
                          )
                      )
                  )
                  THEN CAST(1 AS bit)

                  ELSE CAST(0 AS bit)
              END AS IsHeadJob

          FROM CradleMst C
              WITH (
                  UPDLOCK,
                  HOLDLOCK
              )

          LEFT JOIN dbo.CradleMstRef_Head H
              ON H.CradleDate =
                 CONVERT(
                     date,
                     C.crt_dt
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
      target.fin_dt ||
      targetStatus ===
        "เสร็จสิ้น"
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
      targetStaffNo !==
      normalizedStaffNo
    ) {
      await transaction.rollback();

      return {
        success: false,
        code: "NOT_OWNER",
        message:
          "งานนี้ไม่ได้อยู่ในความรับผิดชอบของผู้ใช้งานปัจจุบัน",
      };
    }

    /**
     * งานหัวหน้า
     * ห้ามยกเลิก
     */
    if (
      getBoolean(
        target.IsHeadJob,
      )
    ) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "HEAD_JOB_CANNOT_CANCEL",
        message:
          "งานที่หัวหน้ามอบหมายไม่สามารถยกเลิกได้",
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
      // ไม่ต้องทำอะไร
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
    !normalizedReqNo ||
    !normalizedStaffNo
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
      target.fin_dt ||
      targetStatus ===
        "เสร็จสิ้น"
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
      targetStaffNo !==
      normalizedStaffNo
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
      // ไม่ต้องทำอะไร
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