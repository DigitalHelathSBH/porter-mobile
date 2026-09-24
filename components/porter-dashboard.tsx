"use client";

import {
  type CSSProperties,
  type ReactNode,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import PorterHeader from "@/components/porter-header";
import type { PorterJob } from "@/types/porter";

import {
  buildNewCaseAlertHtml,
  getTimeOnly,
  useNewJobAlert,
} from "@/lib/porter-alert";

type DashboardView =
  | "ศูนย์เปล ER"
  | "ศูนย์เปล OPD"
  | "finished";

type Props = {
  staffNo: string;
  staffName: string;
  jobs?: PorterJob[];
  alertJobs?: PorterJob[];
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
    !text ||
    text === "-"
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
      slashMatched[3].length ===
      2
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
    `${value.day} ` +
    `${monthName} ` +
    `${value.year}`
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
    !assigned &&
    !finished
  ) {
    return "-";
  }

  if (
    assigned &&
    finished
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
      assigned.day ===
        finished.day &&
      assigned.month ===
        finished.month &&
      assigned.year ===
        finished.year;

    if (isSameDate) {
      return (
        `${assignedDate} ` +
        `${assigned.hour}:${assigned.minute}` +
        " - " +
        `${finished.hour}:${finished.minute}`
      );
    }

    return (
      `${assignedDate} ` +
      `${assigned.hour}:${assigned.minute}` +
      " - " +
      `${finishedDate} ` +
      `${finished.hour}:${finished.minute}`
    );
  }

  if (assigned) {
    return (
      `${formatThaiActivityDate(
        assigned,
      )} ` +
      `${assigned.hour}:${assigned.minute}` +
      " - ยังไม่เสร็จสิ้น"
    );
  }

  return (
    `ไม่พบเวลาเริ่ม - ` +
    `${formatThaiActivityDate(
      finished!,
    )} ` +
    `${finished!.hour}:${finished!.minute}`
  );
}

export default function PorterDashboard({
  staffNo,
  staffName,
  jobs = [],
  alertJobs = [],
  viewMode = "ศูนย์เปล ER",
  disableActiveJobRedirect = false,
}: Props) {
  const router =
    useRouter();

  const isFinishedView =
    viewMode === "finished";

  const headerSubtitle =
    isFinishedView
      ? "ประวัติงานที่เสร็จสิ้น"
      : viewMode === "ศูนย์เปล ER"
        ? "รายการงานศูนย์เปล ER"
        : "รายการงานศูนย์เปล OPD";

  const listSubtitle =
    isFinishedView
      ? "รายการงานที่เสร็จสิ้นวันนี้"
      : viewMode === "ศูนย์เปล ER"
        ? "รายการงานรอรับจากศูนย์เปล ER"
        : "รายการงานรอรับจากศูนย์เปล OPD";

  const emptyTitle =
    isFinishedView
      ? "ยังไม่มีงานเสร็จสิ้น"
      : viewMode === "ศูนย์เปล ER"
        ? "ไม่มีงานศูนย์เปล ER"
        : "ไม่มีงานศูนย์เปล OPD";

  const emptyText =
    isFinishedView
      ? "ไม่พบรายการงานที่เสร็จสิ้นในวันนี้"
      : "ขณะนี้ยังไม่มีรายการงานใหม่";

  /*
   * ตรวจจับงานใหม่ (ทั้ง ER และ OPD)
   * แล้วแสดง SweetAlert
   *
   * alertJobs = งานรอรับจากทั้ง 2 ศูนย์รวมกัน
   * ไม่ขึ้นกับ viewMode ที่กำลังเปิดอยู่
   */
  useNewJobAlert(alertJobs);

  function handleViewChange(
    nextView: DashboardView,
  ): void {
    if (
      nextView ===
      viewMode
    ) {
      return;
    }

    router.replace(
      `/mobile-porter?view=${encodeURIComponent(
        nextView,
      )}`,
    );
  }

  function renderJob(
    job: PorterJob,
    index: number,
    sectionType: "ER" | "OPD" | "finished",
  ) {
    const encodedReqNo =
      encodeURIComponent(
        job.reqNo,
      );

    const detailUrl =
      `/mobile-porter/${encodedReqNo}?view=${encodeURIComponent(viewMode)}`;

    const rowStyle: CSSProperties = {
      ...styles.jobRow,
      gridTemplateColumns:
        isFinishedView
          ? "32px minmax(0, 1fr) auto"
          : "32px minmax(0, 1fr) 20px",
    };

    const displayIndex =
      index + 1;

    const rowContent = (
      <>
        <div
          style={
            styles.jobNumber
          }
        >
          {displayIndex}
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
                {job.reqNo || "-"}
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
                {job.locSource ||
                  "-"}
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
                {job.locDest ||
                  "-"}
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

    if (isFinishedView) {
      return (
        <div
          key={
            `${sectionType}-${job.reqNo}-${index}`
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
          `${sectionType}-${job.reqNo}-${index}`
        }
        href={
          detailUrl
        }
        style={
          rowStyle
        }
        aria-label={
          `รายการที่ ${displayIndex} ` +
          `ต้นทาง ${job.locSource} ` +
          `ปลายทาง ${job.locDest} ` +
          `เวลา ${getTimeOnly(
            job.createdAtShort,
          )}`
        }
      >
        {rowContent}
      </Link>
    );
  }

  return (
    <main
      style={
        styles.page
      }
    >
      <div
        style={
          styles.container
        }
      >
        <PorterHeader
          staffNo={staffNo}
          staffName={staffName}
          title="ระบบรับงานพนักงานเปล"
          subtitle={
            headerSubtitle
          }
          showLogout
        />

        <section
          style={
            styles.listCard
          }
        >
          <div
            style={
              styles.listHeader
            }
          >
            <div
              style={
                styles.statusArea
              }
            >
              <label
                htmlFor="porter-status"
                style={
                  styles.statusLabel
                }
              >
                สถานะ
              </label>

              <div
                id="porter-status"
                role="tablist"
                aria-label="เลือกสถานะงาน"
                style={
                  styles.statusSwitch
                }
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    viewMode === "ศูนย์เปล ER"
                  }
                  onClick={() =>
                    handleViewChange("ศูนย์เปล ER")
                  }
                  style={{
                    ...styles.statusSwitchButton,
                    ...(viewMode === "ศูนย์เปล ER"
                      ? styles.statusSwitchActive
                      : styles.statusSwitchInactive),
                  }}
                >
                  ศูนย์เปล ER
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    viewMode === "ศูนย์เปล OPD"
                  }
                  onClick={() =>
                    handleViewChange("ศูนย์เปล OPD")
                  }
                  style={{
                    ...styles.statusSwitchButton,
                    ...(viewMode === "ศูนย์เปล OPD"
                      ? styles.statusSwitchActive
                      : styles.statusSwitchInactive),
                  }}
                >
                  ศูนย์เปล OPD
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    viewMode === "finished"
                  }
                  onClick={() =>
                    handleViewChange("finished")
                  }
                  style={{
                    ...styles.statusSwitchButton,
                    ...(viewMode === "finished"
                      ? styles.statusSwitchFinished
                      : styles.statusSwitchInactive),
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

          {jobs.length ===
          0 ? (
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
          ) : isFinishedView ? (
            <div
              style={
                styles.jobList
              }
            >
              {jobs.map(
                (
                  job,
                  index,
                ) =>
                  renderJob(
                    job,
                    index,
                    "finished",
                  ),
              )}
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
                ) =>
                  renderJob(
                    job,
                    index,
                    viewMode === "ศูนย์เปล ER"
                      ? "ER"
                      : "OPD",
                  ),
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
      "repeat(3, minmax(0, 1fr))",
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
      "background-color 0.15s ease, " +
      "color 0.15s ease, " +
      "box-shadow 0.15s ease",
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

  /*
   * ER / OPD
   */

  typeColumns: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "8px",
    padding:
      "8px",
    background:
      "#f4f7fa",
    alignItems:
      "start",
  },

  typeCard: {
    minWidth:
      0,
    overflow:
      "hidden",
    borderWidth:
      "1px",
    borderStyle:
      "solid",
    borderRadius:
      "14px",
    background:
      "#ffffff",
  },

  typeCardER: {
    borderColor:
      "#c8dcef",
  },

  typeCardOPD: {
    borderColor:
      "#c8dcef",
  },

  typeHeader: {
    minHeight:
      "48px",
    padding:
      "9px 11px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap:
      "7px",
    borderBottomWidth:
      "1px",
    borderBottomStyle:
      "solid",
    boxSizing:
      "border-box",
  },

  typeHeaderER: {
    background:
      "#f1f7fd",
    borderBottomColor:
      "#d7e6f3",
  },

  typeHeaderOPD: {
    background:
      "#f1f7fd",
    borderBottomColor:
      "#d7e6f3",
  },

  typeTitle: {
    color:
      "#17324d",
    fontSize:
      "16px",
    fontWeight:
      700,
    lineHeight:
      1.2,
  },

  typeCount: {
    padding:
      "5px 8px",
    borderRadius:
      "999px",
    fontSize:
      "11px",
    fontWeight:
      700,
    whiteSpace:
      "nowrap",
  },

  typeCountER: {
    color:
      "#176fca",
    background:
      "#e4f1fc",
  },

  typeCountOPD: {
    color:
      "#176fca",
    background:
      "#e4f1fc",
  },

  typeJobList: {
    display:
      "grid",
    gap:
      "6px",
    padding:
      "6px",
    background:
      "#f8fafc",
  },

  typeEmpty: {
    minHeight:
      "150px",
    padding:
      "25px 10px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    textAlign:
      "center",
  },

  typeEmptyIcon: {
    width:
      "38px",
    height:
      "38px",
    marginBottom:
      "7px",
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
      "18px",
    fontWeight:
      700,
  },

  typeEmptyTitle: {
    color:
      "#718498",
    fontSize:
      "13px",
    fontWeight:
      700,
  },

  /*
   * รายการงานเดิม
   */

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