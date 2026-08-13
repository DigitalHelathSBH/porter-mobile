"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import type { PorterJob } from "@/types/porter";

import PorterHeader from "@/components/porter-header";

import {
  ArrowLeftIcon,
  BedIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  HospitalIcon,
  IvIcon,
  LightningIcon,
  NoteIcon,
  SyringeIcon,
  UserIcon,
  WheelchairIcon,
} from "@/components/porter-icons";

import {
  acceptPorterJob,
  getCurrentPorterAssignment,
  type PorterLiveAssignment,
} from "@/lib/porter-live";

type Props = {
  job: PorterJob;
  staffNo: string;
  staffName: string;
};

function getUrgencyStyle(
  fastTrack: string,
): CSSProperties {
  switch (
    String(
      fastTrack ?? "0",
    ).trim()
  ) {
    case "2":
      return {
        color: "#d74646",
        backgroundColor: "#fff0f0",
        borderColor: "#ef5a5a",
      };

    case "1":
      return {
        color: "#986400",
        backgroundColor: "#fff8dc",
        borderColor: "#e7b63c",
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

function HourglassIcon({
  size = 14,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
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

function getUrgencyIcon(
  fastTrack: string,
): ReactNode {
  switch (
    String(
      fastTrack ?? "0",
    ).trim()
  ) {
    case "2":
      return (
        <LightningIcon
          size={14}
          color="currentColor"
        />
      );

    case "1":
      return (
        <ClockIcon
          size={14}
          color="currentColor"
        />
      );

    case "0":
    default:
      return (
        <HourglassIcon
          size={14}
          color="currentColor"
        />
      );
  }
}

function getEquipmentIcon(
  equipment: string | null | undefined,
): ReactNode {
  const text =
    String(
      equipment ?? "",
    ).toLowerCase();

  const isSyringe =
    text.includes("เข็ม")
    || text.includes("ฉีด")
    || text.includes("syringe")
    || text.includes("pump");

  if (isSyringe) {
    return (
      <SyringeIcon
        size={22}
        color="#1774c8"
      />
    );
  }

  return (
    <IvIcon
      size={22}
      color="#1774c8"
    />
  );
}

function DetailDescriptionIcon({
  size = 22,
  color = "#1774c8",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 20L8.5 19L19 8.5L15.5 5L5 15.5L4 20Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M13.5 7L17 10.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DetailItem({
  label,
  value,
  icon,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  icon: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.detailItem,
        ...(fullWidth
          ? styles.detailItemFull
          : {}),
      }}
    >
      <div
        style={
          styles.detailIcon
        }
      >
        {icon}
      </div>

      <div
        style={
          styles.detailText
        }
      >
        <div
          style={
            styles.detailLabel
          }
        >
          {label}
        </div>

        <div
          style={
            styles.detailValue
          }
        >
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

export default function PorterDetail({
  job,
  staffNo,
  staffName,
}: Props) {
  const router =
    useRouter();

  const [
    activeAssignment,
    setActiveAssignment,
  ] =
    useState<PorterLiveAssignment | null>(
      null,
    );

  const [
    isReady,
    setIsReady,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  useEffect(() => {
    let isDisposed =
      false;

    async function checkCurrentAssignment(): Promise<void> {
      if (
        !staffNo.trim()
      ) {
        if (
          !isDisposed
        ) {
          setActiveAssignment(
            null,
          );

          setIsReady(
            true,
          );
        }

        return;
      }

      try {
        const assignment =
          await getCurrentPorterAssignment(
            staffNo,
          );

        if (
          isDisposed
        ) {
          return;
        }

        if (
          assignment
        ) {
          setActiveAssignment(
            assignment,
          );

          // =========================
          // ไม่ส่ง userid ใน URL
          // =========================
          router.replace(
            "/mobile-porter/current",
          );

          return;
        }

        setActiveAssignment(
          null,
        );

        setIsReady(
          true,
        );
      } catch (error) {
        console.error(
          "Check current assignment error:",
          error,
        );

        if (
          !isDisposed
        ) {
          setActiveAssignment(
            null,
          );

          setIsReady(
            true,
          );
        }
      }
    }

    void checkCurrentAssignment();

    return () => {
      isDisposed =
        true;
    };
  }, [
    router,
    staffNo,
  ]);

  const isThisJobActive =
    activeAssignment
      ?.job
      .reqNo
    === job.reqNo;

  const hasOtherActiveJob =
    Boolean(
      activeAssignment,
    )
    && !isThisJobActive;

  // =========================
  // กลับหน้าหลัก
  // ไม่ส่ง userid ใน URL
  // =========================
  function handleBack(): void {
    router.push(
      "/mobile-porter",
    );
  }

  // =========================
  // ไปหน้างานปัจจุบัน
  // ไม่ส่ง userid ใน URL
  // =========================
  function goToCurrentJob(): void {
    router.replace(
      "/mobile-porter/current",
    );
  }

  async function handleAccept(): Promise<void> {
    if (
      isSubmitting
    ) {
      return;
    }

    if (
      !staffNo.trim()
    ) {
      await Swal.fire({
        position:
          "top-end",

        toast:
          true,

        icon:
          "error",

        title:
          "ไม่พบรหัสพนักงาน",

        showConfirmButton:
          false,

        timer:
          1800,

        timerProgressBar:
          true,
      });

      return;
    }

    try {
      setIsSubmitting(
        true,
      );

      // =========================
      // รับงานผ่าน API
      // ใช้ POST
      // =========================
      const result =
        await acceptPorterJob({
          staffNo,

          reqNo:
            job.reqNo,
        });

      if (
        !result.success
      ) {
        // =========================
        // งานถูกคนอื่นรับไปแล้ว
        // หรืองานถูกปิดแล้ว
        // =========================
        if (
          result.code
            === "ALREADY_ASSIGNED"
          || result.code
            === "ALREADY_FINISHED"
          || result.code
            === "NOT_ACTIVE"
        ) {
          await Swal.fire({
            position:
              "top-end",

            toast:
              true,

            icon:
              "warning",

            title:
              result.code
                === "ALREADY_FINISHED"
                ? "งานนี้เสร็จสิ้นแล้ว"
                : "งานนี้มีผู้รับแล้ว",

            text:
              result.code
                === "ALREADY_FINISHED"
                ? (
                  "รายการนี้ถูกปิดงานแล้ว "
                  + "ไม่สามารถรับซ้ำได้"
                )
                : (
                  "มีพนักงานคนอื่นรับงานนี้ไปก่อนแล้ว "
                  + "กรุณาเลือกรายการงานอื่น"
                ),

            showConfirmButton:
              false,

            timer:
              2800,

            timerProgressBar:
              true,
          });

          // =========================
          // ไม่ส่ง userid
          // =========================
          router.replace(
            "/mobile-porter",
          );

          router.refresh();

          return;
        }

        // =========================
        // พนักงานคนนี้มีงานอยู่แล้ว
        // =========================
        if (
          result.code
            === "STAFF_HAS_ACTIVE_JOB"
          && result.assignment
        ) {
          setActiveAssignment(
            result.assignment,
          );

          await Swal.fire({
            position:
              "top-end",

            toast:
              true,

            icon:
              "warning",

            title:
              `มีงาน ${
                result.assignment.job.reqNo
              } กำลังดำเนินการอยู่`,

            showConfirmButton:
              false,

            timer:
              2200,

            timerProgressBar:
              true,
          });

          goToCurrentJob();

          return;
        }

        await Swal.fire({
          position:
            "top-end",

          toast:
            true,

          icon:
            "error",

          title:
            "รับงานไม่สำเร็จ",

          text:
            result.message,

          showConfirmButton:
            false,

          timer:
            2500,

          timerProgressBar:
            true,
        });

        return;
      }

      if (
        result.assignment
      ) {
        setActiveAssignment(
          result.assignment,
        );
      }

      await Swal.fire({
        position:
          "top-end",

        toast:
          true,

        icon:
          "success",

        title:
          `รับงาน ${job.reqNo} `
          + "เรียบร้อยแล้ว",

        showConfirmButton:
          false,

        timer:
          1500,

        timerProgressBar:
          true,
      });

      goToCurrentJob();
    } catch (error) {
      console.error(
        "Accept job error:",
        error,
      );

      await Swal.fire({
        position:
          "top-end",

        toast:
          true,

        icon:
          "error",

        title:
          "รับงานไม่สำเร็จ",

        text:
          "ไม่สามารถติดต่อระบบรับงานได้",

        showConfirmButton:
          false,

        timer:
          2500,

        timerProgressBar:
          true,
      });
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

  let acceptButtonText =
    "รับงานนี้";

  if (
    !isReady
  ) {
    acceptButtonText =
      "กำลังตรวจสอบ...";
  } else if (
    isSubmitting
  ) {
    acceptButtonText =
      "กำลังรับงาน...";
  } else if (
    isThisJobActive
  ) {
    acceptButtonText =
      "ไปที่งานปัจจุบัน";
  } else if (
    hasOtherActiveJob
  ) {
    acceptButtonText =
      "มีงานกำลังดำเนินการ";
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
        {/*
          Header กลาง
          หน้านี้ไม่มี showLogout
        */}
        <PorterHeader
          staffNo={
            staffNo
          }
          staffName={
            staffName
          }
          title="ระบบรับงานพนักงานเปล"
          subtitle="รายละเอียดงาน"
        />

        {hasOtherActiveJob && (
          <section
            style={
              styles.warningBox
            }
          >
            <div
              style={
                styles.warningIcon
              }
            >
              !
            </div>

            <div
              style={
                styles.warningContent
              }
            >
              <div
                style={
                  styles.warningTitle
                }
              >
                มีงานกำลังดำเนินการ
              </div>

              <div
                style={
                  styles.warningText
                }
              >
                คุณกำลังทำงาน{" "}
                <strong>
                  {
                    activeAssignment
                      ?.job
                      .reqNo
                  }
                </strong>
                {" "}อยู่
                จึงยังไม่สามารถรับงานนี้ได้
              </div>

              <button
                type="button"
                style={
                  styles.warningButton
                }
                onClick={
                  goToCurrentJob
                }
              >
                เปิดงานปัจจุบัน
              </button>
            </div>
          </section>
        )}

        <section
          style={
            styles.routeCard
          }
        >
          <div
            style={
              styles.routeCardHeader
            }
          >
            <div
              style={
                styles.reqArea
              }
            >
              <div
                style={
                  styles.reqLabel
                }
              >
                รหัสงาน
              </div>

              <div
                style={
                  styles.reqValue
                }
              >
                {
                  job.reqNo
                }
              </div>
            </div>

            <span
              style={{
                ...styles.urgencyBadge,

                ...getUrgencyStyle(
                  job.fastTrack,
                ),
              }}
            >
              {
                getUrgencyIcon(
                  job.fastTrack,
                )
              }

              {
                job.fastTrackText
              }
            </span>
          </div>

          <div
            style={
              styles.routeBox
            }
          >
            <div
              style={
                styles.routeRow
              }
            >
              <div
                style={
                  styles.sourceMarker
                }
              >
                <span
                  style={
                    styles.sourceDot
                  }
                />

                <span
                  style={
                    styles.routeLine
                  }
                />
              </div>

              <div
                style={
                  styles.routeContent
                }
              >
                <div
                  style={
                    styles.sourceLabel
                  }
                >
                  ต้นทาง
                </div>

                <div
                  style={
                    styles.routeValueWithIcon
                  }
                >
                  <BedIcon
                    size={21}
                    color="#2786d8"
                  />

                  <span>
                    {
                      job.locSource
                      || "-"
                    }
                  </span>
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
                  styles.destinationMarker
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
                  styles.routeContentLast
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
                    styles.routeValueWithIcon
                  }
                >
                  <HospitalIcon
                    size={21}
                    color="#2eaa68"
                  />

                  <span>
                    {
                      job.locDest
                      || "-"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={
            styles.detailCard
          }
        >
          <div
            style={
              styles.detailGrid
            }
          >
            <DetailItem
              label="กิจกรรม"
              value={
                job.locAct
              }
              icon={
                <ClipboardIcon
                  size={21}
                  color="#1774c8"
                />
              }
            />

            <DetailItem
              label="ประเภทที่ขอ"
              value={
                job.bedType
              }
              icon={
                <WheelchairIcon
                  size={22}
                  color="#1774c8"
                />
              }
            />

            <DetailItem
              label="เวร"
              value={
                job.shift
              }
              icon={
                <ClockIcon
                  size={21}
                  color="#1774c8"
                />
              }
            />

            <DetailItem
              label="เลขเตียง"
              value={
                job.bedNo
              }
              icon={
                <BedIcon
                  size={22}
                  color="#1774c8"
                />
              }
            />

            <DetailItem
              label="อุปกรณ์"
              value={
                job.equipment
              }
              fullWidth
              icon={
                getEquipmentIcon(
                  job.equipment,
                )
              }
            />

            <DetailItem
              label="รายละเอียด"
              value={
                job.detail
              }
              fullWidth
              icon={
                <DetailDescriptionIcon
                  size={22}
                  color="#1774c8"
                />
              }
            />
            
            <DetailItem
              label="หมายเหตุ"
              value={
                job.remark
              }
              fullWidth
              icon={
                <NoteIcon
                  size={22}
                  color="#1774c8"
                />
              }
            />

            <DetailItem
              label="ผู้แจ้ง"
              value={
                job.createdBy
              }
              fullWidth
              icon={
                <UserIcon
                  size={22}
                  color="#1774c8"
                />
              }
            />

            <DetailItem
              label="วันที่และเวลาที่แจ้งงาน"
              value={
                job.createdAt
              }
              fullWidth
              icon={
                <CalendarIcon
                  size={22}
                  color="#1774c8"
                />
              }
            />
          </div>
        </section>

        <div
          style={
            styles.bottomSpacer
          }
        />

        <div
          style={
            styles.bottomBar
          }
        >
          <button
            type="button"
            style={
              styles.backButton
            }
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon
              size={20}
              color="currentColor"
            />

            ย้อนกลับ
          </button>

          <button
            type="button"
            style={{
              ...styles.acceptButton,

              ...(
                hasOtherActiveJob
                || !isReady
                || isSubmitting
                  ? styles.disabledButton
                  : {}
              ),
            }}
            disabled={
              hasOtherActiveJob
              || !isReady
              || isSubmitting
            }
            onClick={
              isThisJobActive
                ? goToCurrentJob
                : handleAccept
            }
          >
            <CheckIcon
              size={21}
              color="#ffffff"
            />

            {
              acceptButtonText
            }
          </button>
        </div>
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

  warningBox: {
    marginTop:
      "10px",

    marginBottom:
      "10px",

    padding:
      "13px",

    display:
      "flex",

    alignItems:
      "flex-start",

    gap:
      "10px",

    border:
      "1px solid #f2c778",

    borderRadius:
      "14px",

    background:
      "#fff8e5",

    color:
      "#6d4b00",
  },

  warningIcon: {
    width:
      "30px",

    height:
      "30px",

    flex:
      "0 0 30px",

    display:
      "grid",

    placeItems:
      "center",

    borderRadius:
      "50%",

    color:
      "#ffffff",

    background:
      "#c88a08",

    fontWeight:
      700,
  },

  warningContent: {
    minWidth:
      0,

    flex:
      1,
  },

  warningTitle: {
    marginBottom:
      "4px",

    fontWeight:
      700,
  },

  warningText: {
    fontSize:
      "13px",

    lineHeight:
      1.5,
  },

  warningButton: {
    width:
      "100%",

    minHeight:
      "40px",

    marginTop:
      "10px",

    border:
      0,

    borderRadius:
      "10px",

    color:
      "#ffffff",

    background:
      "#b57a00",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  routeCard: {
    marginTop:
      "10px",

    marginBottom:
      "10px",

    padding:
      "14px",

    border:
      "1px solid #edf2f6",

    borderRadius:
      "17px",

    background:
      "#ffffff",

    boxShadow:
      "0 7px 20px rgba(0,0,0,0.06)",
  },

  routeCardHeader: {
    marginBottom:
      "13px",

    paddingBottom:
      "12px",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      "10px",

    borderBottom:
      "1px solid #e6edf5",
  },

  reqArea: {
    minWidth:
      0,

    flex:
      1,
  },

  reqLabel: {
    marginBottom:
      "3px",

    color:
      "#7b8ea1",

    fontSize:
      "11px",
  },

  reqValue: {
    color:
      "#13588f",

    fontSize:
      "18px",

    fontWeight:
      700,

    lineHeight:
      1.35,

    overflowWrap:
      "anywhere",
  },

  urgencyBadge: {
    flex:
      "0 0 auto",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "4px",

    minHeight:
      "34px",

    padding:
      "6px 11px",

    borderWidth:
      "1px",

    borderStyle:
      "solid",

    borderRadius:
      "999px",

    fontSize:
      "11px",

    fontWeight:
      700,

    lineHeight:
      1.2,

    textAlign:
      "center",

    whiteSpace:
      "nowrap",
  },

  routeBox: {
    padding:
      "13px",

    border:
      "1px solid #edf2f6",

    borderRadius:
      "14px",

    background:
      "#f7fafc",
  },

  routeRow: {
    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "flex-start",

    gap:
      "11px",
  },

  sourceMarker: {
    width:
      "14px",

    flex:
      "0 0 14px",

    position:
      "relative",

    display:
      "flex",

    justifyContent:
      "center",
  },

  destinationMarker: {
    width:
      "14px",

    flex:
      "0 0 14px",

    display:
      "flex",

    justifyContent:
      "center",
  },

  sourceDot: {
    width:
      "9px",

    height:
      "9px",

    marginTop:
      "5px",

    zIndex:
      2,

    borderRadius:
      "50%",

    background:
      "#2786d8",

    boxShadow:
      "0 0 0 3px #dfefff",
  },

  destinationDot: {
    width:
      "9px",

    height:
      "9px",

    marginTop:
      "5px",

    borderRadius:
      "50%",

    background:
      "#2eaa68",

    boxShadow:
      "0 0 0 3px #e0f4e8",
  },

  routeLine: {
    width:
      "2px",

    height:
      "48px",

    position:
      "absolute",

    top:
      "13px",

    background:
      "#ccd9e5",
  },

  routeContent: {
    minWidth:
      0,

    flex:
      1,

    paddingBottom:
      "16px",
  },

  routeContentLast: {
    minWidth:
      0,

    flex:
      1,
  },

  sourceLabel: {
    marginBottom:
      "4px",

    color:
      "#2475bd",

    fontSize:
      "11px",
  },

  destinationLabel: {
    marginBottom:
      "4px",

    color:
      "#2c9b61",

    fontSize:
      "11px",
  },

  routeValueWithIcon: {
    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "8px",

    color:
      "#17324d",

    fontSize:
      "15px",

    fontWeight:
      700,

    lineHeight:
      1.4,

    overflowWrap:
      "anywhere",
  },

  detailCard: {
    padding:
      "10px",

    border:
      "1px solid #edf2f6",

    borderRadius:
      "17px",

    background:
      "#ffffff",

    boxShadow:
      "0 7px 20px rgba(0,0,0,0.06)",
  },

  detailGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap:
      "9px",
  },

  detailItem: {
    minWidth:
      0,

    padding:
      "11px",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    border:
      "1px solid #e5edf5",

    borderRadius:
      "12px",

    background:
      "#f8fbfe",
  },

  detailItemFull: {
    gridColumn:
      "1 / -1",
  },

  detailIcon: {
    width:
      "34px",

    height:
      "34px",

    flex:
      "0 0 34px",

    display:
      "grid",

    placeItems:
      "center",

    borderRadius:
      "10px",

    color:
      "#1774c8",

    background:
      "#e8f3fd",
  },

  detailText: {
    minWidth:
      0,

    flex:
      1,
  },

  detailLabel: {
    marginBottom:
      "3px",

    color:
      "#7b8ea1",

    fontSize:
      "10px",
  },

  detailValue: {
    color:
      "#17324d",

    fontSize:
      "14px",

    fontWeight:
      700,

    lineHeight:
      1.4,

    overflowWrap:
      "anywhere",
  },

  bottomSpacer: {
    height:
      "84px",
  },

  bottomBar: {
    width:
      "min(410px, calc(100% - 20px))",

    position:
      "fixed",

    left:
      "50%",

    bottom:
      0,

    zIndex:
      20,

    transform:
      "translateX(-50%)",

    padding:
      "10px 10px calc(10px + env(safe-area-inset-bottom))",

    display:
      "grid",

    gridTemplateColumns:
      "1fr 1.35fr",

    gap:
      "9px",

    background:
      "rgba(238,243,248,0.94)",

    backdropFilter:
      "blur(10px)",

    boxSizing:
      "border-box",
  },

  backButton: {
    minHeight:
      "49px",

    padding:
      "10px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "7px",

    border:
      "1px solid #bfd2e5",

    borderRadius:
      "13px",

    color:
      "#315675",

    background:
      "#ffffff",

    fontSize:
      "14px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  acceptButton: {
    minHeight:
      "49px",

    padding:
      "10px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "7px",

    border:
      0,

    borderRadius:
      "13px",

    color:
      "#ffffff",

    background:
      "#0d6fd1",

    boxShadow:
      "0 7px 17px rgba(13,111,209,0.25)",

    fontSize:
      "14px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  disabledButton: {
    opacity:
      0.55,

    cursor:
      "not-allowed",
  },
};