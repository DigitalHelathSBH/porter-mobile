"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import PorterHeader from "@/components/porter-header";
import { getCurrentPorterAssignment } from "@/lib/porter-live";
import type { PorterJob } from "@/types/porter";

type DashboardView =
  | "active"
  | "finished";

type Props = {
  staffNo: string;
  staffName: string;
  jobs?: PorterJob[];
  viewMode?: DashboardView;
  disableActiveJobRedirect?: boolean;
};

type SmallIconProps = {
  size?: number;
  color?: string;
};

function FastTrackIcon({
  size = 13,
  color = "currentColor",
}: SmallIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.5 2.5L5.5 13H11L10.5 21.5L18.5 10.5H13L13.5 2.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HourglassIcon({
  size = 13,
  color = "currentColor",
}: SmallIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3H17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M7 21H17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M8 3C8 7 9.5 9.5 12 12C9.5 14.5 8 17 8 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 3C16 7 14.5 9.5 12 12C14.5 14.5 16 17 16 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 7H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M10 18H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NormalClockIcon({
  size = 13,
  color = "currentColor",
}: SmallIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2"
      />

      <path
        d="M12 7V12L15.5 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getTimeBadgeStyle(
  fastTrack: string,
): CSSProperties {
  const value = String(
    fastTrack ?? "0",
  ).trim();

  switch (value) {
    case "2":
      return {
        color: "#d93434",
        backgroundColor: "#fff5f5",
        borderColor: "#ef5a5a",
      };

    case "1":
      return {
        color: "#9a6800",
        backgroundColor: "#fff9e8",
        borderColor: "#e3b341",
      };

    case "0":
    default:
      return {
        color: "#596674",
        backgroundColor: "#ffffff",
        borderColor: "#bcc7d2",
      };
  }
}

function getTimeBadgeIcon(
  fastTrack: string,
): ReactNode {
  const value = String(
    fastTrack ?? "0",
  ).trim();

  switch (value) {
    case "2":
      return (
        <FastTrackIcon
          size={13}
          color="currentColor"
        />
      );

    case "1":
      return (
        <NormalClockIcon
          size={13}
          color="currentColor"
        />
      );

    case "0":
    default:
      return (
        <HourglassIcon
          size={13}
          color="currentColor"
        />
      );
  }
}

function getTimeOnly(
  value: string | null | undefined,
): string {
  const text = String(
    value ?? "",
  ).trim();

  if (
    !text
    || text === "-"
  ) {
    return "-";
  }

  const matchedTime =
    text.match(
      /(\d{2}:\d{2})(?::\d{2})?$/,
    );

  return matchedTime
    ? matchedTime[1]
    : text;
}

type AlertUrgencyInfo = {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  iconHtml: string;
};

function getAlertUrgencyInfo(
  fastTrack: string,
): AlertUrgencyInfo {
  const value = String(
    fastTrack ?? "0",
  ).trim();

  switch (value) {
    case "2":
      return {
        label: "FastTrack",
        color: "#d93434",
        backgroundColor: "#fff5f5",
        borderColor: "#ef5a5a",

        iconHtml: `
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style="
              display: block;
              flex: 0 0 auto;
            "
          >
            <path
              d="M13.5 2.5L5.5 13H11L10.5 21.5L18.5 10.5H13L13.5 2.5Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        `,
      };

    case "1":
      return {
        label: "ด่วน",
        color: "#9a6800",
        backgroundColor: "#fff9e8",
        borderColor: "#e3b341",

        iconHtml: `
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style="
              display: block;
              flex: 0 0 auto;
            "
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="2"
            />

            <path
              d="M12 7V12L15.5 14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        `,
      };

    case "0":
    default:
      return {
        label: "ปกติ",
        color: "#596674",
        backgroundColor: "#ffffff",
        borderColor: "#bcc7d2",

        iconHtml: `
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style="
              display: block;
              flex: 0 0 auto;
            "
          >
            <path
              d="M7 3H17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />

            <path
              d="M7 21H17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />

            <path
              d="M8 3C8 7 9.5 9.5 12 12C9.5 14.5 8 17 8 21"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              d="M16 3C16 7 14.5 9.5 12 12C14.5 14.5 16 17 16 21"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        `,
      };
  }
}

function escapeHtml(
  value: string | null | undefined,
): string {
  return String(
    value ?? "",
  )
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}

function buildNewCaseAlertHtml(
  newJobs: PorterJob[],
): string {
  const displayedJobs =
    newJobs.slice(
      0,
      3,
    );

  const jobHtml =
    displayedJobs
      .map(
        (job) => {
          const urgency =
            getAlertUrgencyInfo(
              job.fastTrack,
            );

          const time =
            getTimeOnly(
              job.createdAtShort,
            );

          const source =
            escapeHtml(
              job.locSource
              || "-",
            );

          const destination =
            escapeHtml(
              job.locDest
              || "-",
            );

          return `
            <div
              style="
                padding: 5px 0;
                text-align: left;
              "
            >
              <div
                style="
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 6px;
                  padding: 4px 9px;
                  color: ${urgency.color};
                  background: ${urgency.backgroundColor};
                  border: 1px solid ${urgency.borderColor};
                  border-radius: 999px;
                  font-size: 14px;
                  font-weight: 700;
                  line-height: 1.25;
                  box-sizing: border-box;
                "
              >
                ${urgency.iconHtml}

                <span>
                  ${urgency.label}
                  &nbsp;•&nbsp;
                  ${escapeHtml(time)}
                </span>
              </div>

              <div
                style="
                  color: #4b5563;
                  font-size: 14px;
                  font-weight: 400;
                  line-height: 1.55;
                  overflow-wrap: anywhere;
                "
              >
                ${source}
                &nbsp;→&nbsp;
                ${destination}
              </div>
            </div>
          `;
        },
      )
      .join(
        `
          <div
            style="
              height: 1px;
              margin: 5px 0;
              background: #e5e7eb;
            "
          ></div>
        `,
      );

  const remainingCount =
    newJobs.length
    - displayedJobs.length;

  const remainingHtml =
    remainingCount > 0
      ? `
        <div
          style="
            margin-top: 8px;
            color: #718498;
            font-size: 12px;
            text-align: left;
          "
        >
          และอีก ${remainingCount} เคส
        </div>
      `
      : "";

  return `
    <div
      style="
        width: 100%;
        box-sizing: border-box;
      "
    >
      ${jobHtml}
      ${remainingHtml}
    </div>
  `;
}

const THAI_MONTHS = [
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

type ActivityDateTimeParts = {
  day: number;
  month: number;
  year: number;
  hour: string;
  minute: string;
};

function parseActivityDateTime(
  value: string | null | undefined,
): ActivityDateTimeParts | null {
  const text = String(
    value ?? "",
  ).trim();

  if (
    !text
    || text === "-"
  ) {
    return null;
  }

  const slashMatched =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::\d{2})?$/,
    );

  if (slashMatched) {
    const day =
      Number(
        slashMatched[1],
      );

    const month =
      Number(
        slashMatched[2],
      );

    let year =
      Number(
        slashMatched[3],
      );

    if (
      slashMatched[3].length
      === 2
    ) {
      year += 2500;
    } else if (
      year < 2400
    ) {
      year += 543;
    }

    return {
      day,
      month,
      year,

      hour:
        slashMatched[4].padStart(
          2,
          "0",
        ),

      minute:
        slashMatched[5],
    };
  }

  const sqlMatched =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/,
    );

  if (sqlMatched) {
    const christianYear =
      Number(
        sqlMatched[1],
      );

    return {
      day:
        Number(
          sqlMatched[3],
        ),

      month:
        Number(
          sqlMatched[2],
        ),

      year:
        christianYear < 2400
          ? christianYear + 543
          : christianYear,

      hour:
        sqlMatched[4].padStart(
          2,
          "0",
        ),

      minute:
        sqlMatched[5],
    };
  }

  return null;
}

function formatThaiActivityDate(
  value: ActivityDateTimeParts,
): string {
  const monthName =
    THAI_MONTHS[
      value.month - 1
    ];

  if (!monthName) {
    return "-";
  }

  return (
    `${value.day} `
    + `${monthName} `
    + `${value.year}`
  );
}

function formatActivityPeriod(
  assignedAt: string | null | undefined,
  finishedAt: string | null | undefined,
): string {
  const assigned =
    parseActivityDateTime(
      assignedAt,
    );

  const finished =
    parseActivityDateTime(
      finishedAt,
    );

  if (
    !assigned
    && !finished
  ) {
    return "-";
  }

  if (
    assigned
    && finished
  ) {
    const assignedDate =
      formatThaiActivityDate(
        assigned,
      );

    const finishedDate =
      formatThaiActivityDate(
        finished,
      );

    const isSameDate =
      assigned.day
        === finished.day
      && assigned.month
        === finished.month
      && assigned.year
        === finished.year;

    if (isSameDate) {
      return (
        `${assignedDate} `
        + `${assigned.hour}:${assigned.minute}`
        + " - "
        + `${finished.hour}:${finished.minute}`
      );
    }

    return (
      `${assignedDate} `
      + `${assigned.hour}:${assigned.minute}`
      + " - "
      + `${finishedDate} `
      + `${finished.hour}:${finished.minute}`
    );
  }

  if (assigned) {
    return (
      `${formatThaiActivityDate(
        assigned,
      )} `
      + `${assigned.hour}:${assigned.minute}`
      + " - ยังไม่เสร็จสิ้น"
    );
  }

  return (
    `ไม่พบเวลาเริ่ม - `
    + `${formatThaiActivityDate(
      finished!,
    )} `
    + `${finished!.hour}:${finished!.minute}`
  );
}

export default function PorterDashboard({
  staffNo,
  staffName,
  jobs = [],
  viewMode = "active",
  disableActiveJobRedirect = false,
}: Props) {
  const router =
    useRouter();

  const knownJobReqNosRef =
    useRef<Set<string>>(
      new Set(),
    );

  const hasInitializedActiveJobsRef =
    useRef(false);

  const isFinishedView =
    viewMode === "finished";

  const headerSubtitle =
    isFinishedView
      ? "ประวัติงานที่เสร็จสิ้น"
      : "รายการงานรอรับ";

  const listSubtitle =
    isFinishedView
      ? "รายการงานที่เสร็จสิ้นวันนี้"
      : "กดรายการเพื่อดูรายละเอียดงาน";

  const emptyTitle =
    isFinishedView
      ? "ยังไม่มีงานเสร็จสิ้น"
      : "ไม่มีงานรอรับ";

  const emptyText =
    isFinishedView
      ? "ไม่พบรายการงานที่เสร็จสิ้นในวันนี้"
      : "ขณะนี้ยังไม่มีรายการงานใหม่";

  useEffect(() => {
    const currentReqNos =
      new Set(
        jobs.map(
          (job) =>
            job.reqNo,
        ),
      );

    if (isFinishedView) {
      return;
    }

    if (
      !hasInitializedActiveJobsRef.current
    ) {
      knownJobReqNosRef.current =
        currentReqNos;

      hasInitializedActiveJobsRef.current =
        true;

      return;
    }

    const newJobs =
      jobs.filter(
        (job) =>
          !knownJobReqNosRef.current.has(
            job.reqNo,
          ),
      );

    knownJobReqNosRef.current =
      currentReqNos;

    if (
      newJobs.length
      === 0
    ) {
      return;
    }

    const alertTitle =
      newJobs.length === 1
        ? "มีเคสใหม่ค่ะ"
        : (
          `มีเคสใหม่ `
          + `${newJobs.length} เคสค่ะ`
        );

    void Swal.fire({
      position:
        "top-end",

      toast:
        true,

      icon:
        "info",

      title:
        alertTitle,

      html:
        buildNewCaseAlertHtml(
          newJobs,
        ),

      showConfirmButton:
        false,

      timer:
        5000,

      timerProgressBar:
        true,

      width:
        "390px",
    });
  }, [
    isFinishedView,
    jobs,
  ]);

  useEffect(() => {
    let isDisposed =
      false;

    async function checkCurrentAssignment(): Promise<boolean> {
      if (
        disableActiveJobRedirect
        || !staffNo
      ) {
        return false;
      }

      try {
        const assignment =
          await getCurrentPorterAssignment(
            staffNo,
          );

        if (
          isDisposed
          || !assignment
        ) {
          return false;
        }

        // =========================
        // ไม่ส่ง userid ใน URL แล้ว
        // =========================
        router.replace(
          "/mobile-porter/current",
        );

        return true;
      } catch (error) {
        console.error(
          "Check current porter assignment error:",
          error,
        );

        return false;
      }
    }

    async function refreshJobs(): Promise<void> {
      if (
        document.visibilityState
        !== "visible"
      ) {
        return;
      }

      const redirected =
        await checkCurrentAssignment();

      if (
        redirected
        || isDisposed
      ) {
        return;
      }

      router.refresh();
    }

    void refreshJobs();

    const timer =
      window.setInterval(
        () => {
          void refreshJobs();
        },
        30_000,
      );

    function handleVisibilityChange(): void {
      if (
        document.visibilityState
        === "visible"
      ) {
        void refreshJobs();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      isDisposed =
        true;

      window.clearInterval(
        timer,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    disableActiveJobRedirect,
    router,
    staffNo,
  ]);

  function handleViewChange(
    nextView: DashboardView,
  ): void {
    if (
      nextView
      === viewMode
    ) {
      return;
    }

    // =========================
    // ไม่ส่ง userid แล้ว
    // =========================
    if (
      nextView
      === "finished"
    ) {
      router.replace(
        "/mobile-porter?view=finished",
      );

      return;
    }

    router.replace(
      "/mobile-porter",
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <PorterHeader
          staffNo={staffNo}
          staffName={staffName}
          title="ระบบรับงานพนักงานเปล"
          subtitle={headerSubtitle}
          showLogout
        />

        <section style={styles.listCard}>
          <div style={styles.listHeader}>
            <div style={styles.statusArea}>
              <label
                htmlFor="porter-status"
                style={styles.statusLabel}
              >
                สถานะ
              </label>

              <div
                id="porter-status"
                role="tablist"
                aria-label="เลือกสถานะงาน"
                style={styles.statusSwitch}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    viewMode
                    === "active"
                  }
                  onClick={() =>
                    handleViewChange(
                      "active",
                    )
                  }
                  style={{
                    ...styles.statusSwitchButton,

                    ...(
                      viewMode
                      === "active"
                        ? styles.statusSwitchActive
                        : styles.statusSwitchInactive
                    ),
                  }}
                >
                  กำลังดำเนินการ
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    viewMode
                    === "finished"
                  }
                  onClick={() =>
                    handleViewChange(
                      "finished",
                    )
                  }
                  style={{
                    ...styles.statusSwitchButton,

                    ...(
                      viewMode
                      === "finished"
                        ? styles.statusSwitchFinished
                        : styles.statusSwitchInactive
                    ),
                  }}
                >
                  เสร็จสิ้น
                </button>
              </div>

              <div
                style={
                  styles.listSubtitle
                }
              >
                {listSubtitle}
              </div>
            </div>

            <div
              style={
                styles.countBadge
              }
            >
              {jobs.length} เคส
            </div>
          </div>

          {jobs.length === 0 ? (
            <div
              style={
                styles.emptyState
              }
            >
              <div
                style={
                  styles.emptyIcon
                }
              >
                ✓
              </div>

              <div
                style={
                  styles.emptyTitle
                }
              >
                {emptyTitle}
              </div>

              <div
                style={
                  styles.emptyText
                }
              >
                {emptyText}
              </div>
            </div>
          ) : (
            <div
              style={
                styles.jobList
              }
            >
              {jobs.map(
                (
                  job,
                  index,
                ) => {
                  const encodedReqNo =
                    encodeURIComponent(
                      job.reqNo,
                    );

                  // =========================
                  // ไม่มี ?userid=... แล้ว
                  // =========================
                  const detailUrl =
                    `/mobile-porter/${encodedReqNo}`;

                  const rowStyle: CSSProperties = {
                    ...styles.jobRow,

                    gridTemplateColumns:
                      isFinishedView
                        ? (
                          "32px "
                          + "minmax(0, 1fr) "
                          + "auto"
                        )
                        : (
                          "32px "
                          + "minmax(0, 1fr) "
                          + "20px"
                        ),
                  };

                  const rowContent = (
                    <>
                      <div
                        style={
                          styles.jobNumber
                        }
                      >
                        {index + 1}
                      </div>

                      <div
                        style={
                          styles.routeArea
                        }
                      >
                        {isFinishedView && (
                          <div
                            style={
                              styles.finishedReqNoBlock
                            }
                          >
                            <div
                              style={
                                styles.finishedReqNoLabel
                              }
                            >
                              รหัสงาน
                            </div>

                            <div
                              style={
                                styles.finishedReqNoValue
                              }
                            >
                              {
                                job.reqNo
                                || "-"
                              }
                            </div>
                          </div>
                        )}

                        <div
                          style={
                            styles.routeRow
                          }
                        >
                          <div
                            style={
                              styles.sourcePoint
                            }
                          >
                            <span
                              style={
                                styles.sourceDot
                              }
                            />

                            <span
                              style={
                                styles.routeLineTop
                              }
                            />
                          </div>

                          <div
                            style={
                              styles.routeText
                            }
                          >
                            <div
                              style={
                                styles.routeHeaderRow
                              }
                            >
                              <div
                                style={
                                  styles.routeLabel
                                }
                              >
                                ต้นทาง
                              </div>

                              {!isFinishedView && (
                                <span
                                  style={{
                                    ...styles.jobTimeBadge,

                                    ...getTimeBadgeStyle(
                                      job.fastTrack,
                                    ),
                                  }}
                                  title={
                                    job.fastTrackText
                                  }
                                >
                                  <span
                                    style={
                                      styles.jobTimeBadgeIcon
                                    }
                                  >
                                    {getTimeBadgeIcon(
                                      job.fastTrack,
                                    )}
                                  </span>

                                  <span>
                                    {getTimeOnly(
                                      job.createdAtShort,
                                    )}
                                  </span>
                                </span>
                              )}
                            </div>

                            <div
                              style={
                                styles.routeValue
                              }
                            >
                              {
                                job.locSource
                                || "-"
                              }
                            </div>
                          </div>
                        </div>

                        <div
                          style={
                            styles.routeRow
                          }
                        >
                          <div
                            style={
                              styles.destinationPoint
                            }
                          >
                            <span
                              style={
                                styles.destinationDot
                              }
                            />
                          </div>

                          <div
                            style={
                              styles.routeText
                            }
                          >
                            <div
                              style={
                                styles.destinationLabel
                              }
                            >
                              ปลายทาง
                            </div>

                            <div
                              style={
                                styles.routeValue
                              }
                            >
                              {
                                job.locDest
                                || "-"
                              }
                            </div>
                          </div>
                        </div>

                        {isFinishedView && (
                          <div
                            style={
                              styles.finishedDateBlock
                            }
                          >
                            <div
                              style={
                                styles.finishedDateLabel
                              }
                            >
                              เวลาเริ่มทำกิจกรรม - เวลาเสร็จสิ้น
                            </div>

                            <div
                              style={
                                styles.finishedDateValue
                              }
                            >
                              {formatActivityPeriod(
                                job.assignedAt,
                                job.finishedAt,
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {isFinishedView ? (
                        <div
                          style={
                            styles.finishedBadge
                          }
                          title="เสร็จสิ้น"
                        >
                          เสร็จสิ้น
                        </div>
                      ) : (
                        <div
                          style={
                            styles.arrow
                          }
                          aria-hidden="true"
                        >
                          ›
                        </div>
                      )}
                    </>
                  );

                  if (
                    isFinishedView
                  ) {
                    return (
                      <div
                        key={
                          `${job.reqNo}-${index}`
                        }
                        style={
                          rowStyle
                        }
                      >
                        {rowContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={
                        `${job.reqNo}-${index}`
                      }
                      href={
                        detailUrl
                      }
                      style={
                        rowStyle
                      }
                      aria-label={
                        `รายการที่ ${index + 1} `
                        + `ต้นทาง ${job.locSource} `
                        + `ปลายทาง ${job.locDest} `
                        + `เวลา ${
                          getTimeOnly(
                            job.createdAtShort,
                          )
                        }`
                      }
                    >
                      {rowContent}
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight:
      "100vh",

    padding:
      "10px",

    background:
      "#eef3f8",

    fontFamily:
      'Tahoma, "Noto Sans Thai", Arial, sans-serif',
  },

  container: {
    width:
      "100%",

    maxWidth:
      "430px",

    margin:
      "0 auto",
  },

  listCard: {
    overflow:
      "hidden",

    borderRadius:
      "18px",

    background:
      "#ffffff",

    boxShadow:
      "0 8px 22px rgba(0,0,0,0.06)",
  },

  listHeader: {
    padding:
      "14px 15px",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      "10px",

    borderBottomWidth:
      "1px",

    borderBottomStyle:
      "solid",

    borderBottomColor:
      "#e5edf5",
  },

  statusArea: {
    minWidth:
      0,

    flex:
      1,
  },

  statusLabel: {
    display:
      "block",

    marginBottom:
      "4px",

    color:
      "#718498",

    fontSize:
      "10px",
  },

  statusSwitch: {
    width:
      "100%",

    maxWidth:
      "300px",

    display:
      "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    padding:
      "3px",

    gap:
      "3px",

    borderWidth:
      "1px",

    borderStyle:
      "solid",

    borderColor:
      "#c9d9e8",

    borderRadius:
      "12px",

    background:
      "#eef3f8",

    boxSizing:
      "border-box",
  },

  statusSwitchButton: {
    minWidth:
      0,

    minHeight:
      "38px",

    padding:
      "7px 9px",

    borderWidth:
      0,

    borderStyle:
      "none",

    borderRadius:
      "9px",

    fontFamily:
      "inherit",

    fontSize:
      "13px",

    fontWeight:
      700,

    lineHeight:
      1.25,

    whiteSpace:
      "nowrap",

    cursor:
      "pointer",

    transition:
      "background-color 0.15s ease, "
      + "color 0.15s ease, "
      + "box-shadow 0.15s ease",

    WebkitTapHighlightColor:
      "transparent",

    boxSizing:
      "border-box",
  },

  statusSwitchActive: {
    color:
      "#ffffff",

    background:
      "#176fca",

    boxShadow:
      "0 3px 8px rgba(23,111,202,0.24)",
  },

  statusSwitchFinished: {
    color:
      "#ffffff",

    background:
      "#23885a",

    boxShadow:
      "0 3px 8px rgba(35,136,90,0.24)",
  },

  statusSwitchInactive: {
    color:
      "#5f7285",

    background:
      "transparent",

    boxShadow:
      "none",
  },

  listSubtitle: {
    marginTop:
      "5px",

    color:
      "#7b8ea1",

    fontSize:
      "11px",

    lineHeight:
      1.35,
  },

  countBadge: {
    flex:
      "0 0 auto",

    padding:
      "7px 11px",

    borderRadius:
      "999px",

    color:
      "#0d5ca6",

    background:
      "#e8f2fc",

    fontSize:
      "13px",

    fontWeight:
      700,

    whiteSpace:
      "nowrap",
  },

  jobList: {
    display:
      "grid",

    padding:
      "7px",

    gap:
      "7px",

    background:
      "#f4f7fa",
  },

  jobRow: {
    minHeight:
      "112px",

    padding:
      "13px 11px",

    display:
      "grid",

    alignItems:
      "start",

    columnGap:
      "9px",

    color:
      "inherit",

    background:
      "#ffffff",

    borderWidth:
      "1px",

    borderStyle:
      "solid",

    borderColor:
      "#edf2f6",

    borderRadius:
      "14px",

    boxShadow:
      "0 4px 14px rgba(18,66,105,0.07)",

    textDecoration:
      "none",

    WebkitTapHighlightColor:
      "transparent",

    boxSizing:
      "border-box",
  },

  jobNumber: {
    gridColumn:
      "1",

    gridRow:
      "1",

    width:
      "30px",

    height:
      "30px",

    display:
      "grid",

    placeItems:
      "center",

    borderRadius:
      "9px",

    color:
      "#ffffff",

    background:
      "linear-gradient(135deg, #0d5ca6, #147bc9)",

    boxShadow:
      "0 4px 9px rgba(13,92,166,0.18)",

    fontSize:
      "15px",

    fontWeight:
      700,
  },

  routeArea: {
    gridColumn:
      "2",

    gridRow:
      "1",

    minWidth:
      0,

    display:
      "grid",

    gap:
      "8px",
  },

  routeRow: {
    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "flex-start",

    gap:
      "9px",
  },

  sourcePoint: {
    width:
      "12px",

    flex:
      "0 0 12px",

    position:
      "relative",

    display:
      "flex",

    justifyContent:
      "center",
  },

  destinationPoint: {
    width:
      "12px",

    flex:
      "0 0 12px",

    display:
      "flex",

    justifyContent:
      "center",
  },

  sourceDot: {
    width:
      "8px",

    height:
      "8px",

    marginTop:
      "5px",

    zIndex:
      2,

    borderRadius:
      "50%",

    background:
      "#2786d8",

    boxShadow:
      "0 0 0 3px #e0f0ff",
  },

  destinationDot: {
    width:
      "8px",

    height:
      "8px",

    marginTop:
      "5px",

    borderRadius:
      "50%",

    background:
      "#2eaa68",

    boxShadow:
      "0 0 0 3px #e2f5ea",
  },

  routeLineTop: {
    width:
      "2px",

    height:
      "30px",

    position:
      "absolute",

    top:
      "13px",

    background:
      "#cedae6",
  },

  routeText: {
    minWidth:
      0,

    flex:
      1,
  },

  routeHeaderRow: {
    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      "6px",

    marginBottom:
      "3px",
  },

  routeLabel: {
    flex:
      "0 0 auto",

    color:
      "#2475bd",

    fontSize:
      "11px",
  },

  destinationLabel: {
    marginBottom:
      "3px",

    color:
      "#2c9b61",

    fontSize:
      "11px",
  },

  routeValue: {
    minWidth:
      0,

    width:
      "100%",

    color:
      "#17324d",

    fontSize:
      "14px",

    fontWeight:
      700,

    lineHeight:
      1.4,

    wordBreak:
      "normal",

    overflowWrap:
      "break-word",
  },

  jobTimeBadge: {
    flex:
      "0 0 auto",

    minWidth:
      "66px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "5px",

    padding:
      "4px 8px",

    borderWidth:
      "1px",

    borderStyle:
      "solid",

    borderColor:
      "transparent",

    borderRadius:
      "999px",

    fontSize:
      "11px",

    fontWeight:
      700,

    lineHeight:
      1.2,

    whiteSpace:
      "nowrap",

    boxSizing:
      "border-box",
  },

  jobTimeBadgeIcon: {
    flex:
      "0 0 auto",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    lineHeight:
      1,
  },

  finishedDateBlock: {
    marginTop:
      "4px",

    marginLeft:
      "21px",

    paddingTop:
      "8px",

    borderTopWidth:
      "1px",

    borderTopStyle:
      "dashed",

    borderTopColor:
      "#dce7f0",
  },

  finishedReqNoBlock: {
    marginBottom:
      "1px",

    paddingBottom:
      "8px",

    borderBottomWidth:
      "1px",

    borderBottomStyle:
      "dashed",

    borderBottomColor:
      "#dce7f0",
  },

  finishedReqNoLabel: {
    marginBottom:
      "2px",

    color:
      "#7b8ea1",

    fontSize:
      "10px",

    lineHeight:
      1.35,
  },

  finishedReqNoValue: {
    color:
      "#0d5ca6",

    fontSize:
      "14px",

    fontWeight:
      700,

    lineHeight:
      1.35,

    overflowWrap:
      "anywhere",
  },

  finishedDateLabel: {
    marginBottom:
      "3px",

    color:
      "#7b8ea1",

    fontSize:
      "10px",

    lineHeight:
      1.35,
  },

  finishedDateValue: {
    color:
      "#17324d",

    fontSize:
      "13px",

    fontWeight:
      700,

    lineHeight:
      1.35,
  },

  arrow: {
    gridColumn:
      "3",

    gridRow:
      "1",

    alignSelf:
      "center",

    width:
      "20px",

    color:
      "#0d6fd1",

    fontSize:
      "30px",

    lineHeight:
      1,

    textAlign:
      "center",
  },

  finishedBadge: {
    gridColumn:
      "3",

    gridRow:
      "1",

    alignSelf:
      "center",

    minWidth:
      "74px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "7px 11px",

    borderWidth:
      "1px",

    borderStyle:
      "solid",

    borderColor:
      "#5ebf85",

    borderRadius:
      "999px",

    color:
      "#1e8a50",

    background:
      "#f0fbf5",

    fontSize:
      "12px",

    fontWeight:
      700,

    lineHeight:
      1.2,

    whiteSpace:
      "nowrap",

    boxSizing:
      "border-box",

    transform:
      "translateY(-67px)",
  },

  emptyState: {
    padding:
      "42px 18px",

    color:
      "#7b8ea1",

    textAlign:
      "center",
  },

  emptyIcon: {
    width:
      "44px",

    height:
      "44px",

    margin:
      "0 auto 9px",

    display:
      "grid",

    placeItems:
      "center",

    borderRadius:
      "50%",

    color:
      "#258d55",

    background:
      "#e9f8ef",

    fontSize:
      "21px",

    fontWeight:
      700,
  },

  emptyTitle: {
    marginBottom:
      "4px",

    color:
      "#17324d",

    fontSize:
      "16px",

    fontWeight:
      700,
  },

  emptyText: {
    fontSize:
      "12px",

    lineHeight:
      1.5,
  },
};