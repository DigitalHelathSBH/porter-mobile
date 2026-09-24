"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import Swal from "sweetalert2";

import PorterHeader from "@/components/porter-header";

import {
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
  cancelPorterJob,
  finishPorterJob,
  getCurrentPorterAssignment,
  type PorterLiveAssignment,
} from "@/lib/porter-live";

type Props = {
  staffNo: string;
};

function getUrgencyStyle(
  fastTrack: string | null | undefined,
): CSSProperties {
  switch (String(fastTrack ?? "0").trim()) {
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
  fastTrack: string | null | undefined,
): ReactNode {
  switch (String(fastTrack ?? "0").trim()) {
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
  const text = String(
    equipment ?? "",
  ).toLowerCase();

  const isSyringe =
    text.includes("เข็ม") ||
    text.includes("ฉีด") ||
    text.includes("syringe") ||
    text.includes("pump");

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

function formatAssignedAt(
  value: string | null | undefined,
): string {
  if (!value) {
    return "-";
  }

  const text = String(value).trim();

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

  const matched = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::\d{2})?$/,
  );

  if (matched) {
    const day = Number(matched[1]);

    const monthIndex =
      Number(matched[2]) - 1;

    let year = Number(matched[3]);

    if (year < 2400) {
      year += 543;
    }

    const hour =
      matched[4].padStart(2, "0");

    const minute = matched[5];

    if (
      monthIndex >= 0 &&
      monthIndex < thaiMonths.length
    ) {
      return `${day} ${thaiMonths[monthIndex]} ${year} ${hour}:${minute}`;
    }
  }

  return text;
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
      <div style={styles.detailIcon}>
        {icon}
      </div>

      <div style={styles.detailText}>
        <div style={styles.detailLabel}>
          {label}
        </div>

        <div style={styles.detailValue}>
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

export default function PorterCurrentJob({
  staffNo,
}: Props) {
  const router = useRouter();

  const [
    assignment,
    setAssignment,
  ] =
    useState<PorterLiveAssignment | null>(
      null,
    );

  const [
    isReady,
    setIsReady, 
  ] = useState(false);

  const [
    processingReqNo,
    setProcessingReqNo,
  ] = useState<string | null>(null);

  const [
    processingAction,
    setProcessingAction,
  ] =
    useState<
      "cancel" | "finish" | null
    >(null);
  
  const isDisposedRef =
    useRef(false);

  function goToDashboard(): void {
    router.replace(
      "/mobile-porter",
    );
  }

  useEffect(() => {
  isDisposedRef.current = false;

  async function loadCurrentAssignment(): Promise<void> {
    if (!staffNo.trim()) {
      goToDashboard();
      return;
    }

    try {
      let currentAssignment:
        | PorterLiveAssignment
        | null = null;

      for (
        let attempt = 0;
        attempt < 3;
        attempt++
      ) {
        if (isDisposedRef.current) {
          return;
        }

        currentAssignment =
          await getCurrentPorterAssignment(
            staffNo,
          );

        if (currentAssignment) {
          break;
        }

        if (attempt < 2) {
          await new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                500,
              );
            },
          );
        }
      }

      if (isDisposedRef.current) {
        return;
      }

      if (
        !currentAssignment ||
        !currentAssignment.jobs ||
        currentAssignment.jobs.length === 0
      ) {
        goToDashboard();
        return;
      }

      setAssignment(
        currentAssignment,
      );

      setIsReady(true);
    } catch (error) {
      console.error(
        "Load current assignment error:",
        error,
      );

      if (
        !isDisposedRef.current
      ) {
        await Swal.fire({
          position: "top-end",
          toast: true,
          icon: "error",
          title:
            "โหลดงานปัจจุบันไม่สำเร็จ",
          showConfirmButton: false,
          timer: 2200,
          timerProgressBar: true,
        });

        goToDashboard();
      }
    }
  }

  async function pollCurrentAssignment(): Promise<void> {
    if (
      isDisposedRef.current ||
      !staffNo.trim()
    ) {
      return;
    }

    try {
      const nextAssignment =
        await getCurrentPorterAssignment(
          staffNo,
        );

      if (
        isDisposedRef.current
      ) {
        return;
      }

      /*
       * ถ้ามีงานใหม่ ให้เอาข้อมูลชุดใหม่มาแสดงทันที
       * โดยไม่เปลี่ยนหน้าตา UI
       */
      if (
        nextAssignment &&
        nextAssignment.jobs &&
        nextAssignment.jobs.length > 0
      ) {
        setAssignment(
          nextAssignment,
        );
      }
    } catch (error) {
      /*
       * การ polling ถ้าพลาดชั่วคราว
       * ไม่ต้องเด้งออกจากหน้า
       * และไม่ต้องแสดง Swal ทุก 30 วินาที
       */
      console.error(
        "Polling current assignment error:",
        error,
      );
    }
  }

  void loadCurrentAssignment();

  /*
   * ตรวจงานใหม่ทุก 30 วินาที
   */
  const intervalId =
    window.setInterval(() => {
      void pollCurrentAssignment();
    }, 30000);

  /*
   * ถ้ากลับมาเปิดหน้า / กลับมา Tab นี้
   * ให้ตรวจงานใหม่ทันที
   */
  const handleVisibilityChange =
    (): void => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void pollCurrentAssignment();
      }
    };

  const handleFocus =
    (): void => {
      void pollCurrentAssignment();
    };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange,
  );

  window.addEventListener(
    "focus",
    handleFocus,
  );

  return () => {
    isDisposedRef.current = true;

    window.clearInterval(
      intervalId,
    );

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.removeEventListener(
      "focus",
      handleFocus,
    );
  };
}, [staffNo]);

  async function reloadAssignment(): Promise<boolean> {
    try {
      const nextAssignment =
        await getCurrentPorterAssignment(
          staffNo,
        );

      if (
        !nextAssignment ||
        !nextAssignment.jobs ||
        nextAssignment.jobs.length === 0
      ) {
        setAssignment(null);
        return false;
      }

      setAssignment(
        nextAssignment,
      );

      return true;
    } catch (error) {
      console.error(
        "Reload current assignment error:",
        error,
      );

      return false;
    }
  }

  async function handleCancel(
    reqNo: string,
  ): Promise<void> {
    if (
      !assignment ||
      processingReqNo ||
      !reqNo.trim()
    ) {
      return;
    }

    const job =
      assignment.jobs.find(
        (item) =>
          item.reqNo === reqNo,
      );

    if (!job) {
      return;
    }

    if (job.isHeadJob) {
      return;
    }

    try {
      setProcessingReqNo(reqNo);
      setProcessingAction("cancel");

      const result =
        await cancelPorterJob({
          staffNo,
          reqNo,
        });

      if (!result.success) {
        await Swal.fire({
          position: "top-end",
          toast: true,
          icon: "error",
          title:
            "ยกเลิกงานไม่สำเร็จ",
          text: result.message,
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
        });

        return;
      }

      const hasNextJobs =
        await reloadAssignment();

      await Swal.fire({
        position: "top-end",
        toast: true,
        icon: "success",
        title:
          `ยกเลิกงาน ${reqNo} เรียบร้อยแล้ว`,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      if (!hasNextJobs) {
        goToDashboard();
      }
    } catch (error) {
      console.error(
        "Cancel job error:",
        error,
      );

      await Swal.fire({
        position: "top-end",
        toast: true,
        icon: "error",
        title:
          "ยกเลิกงานไม่สำเร็จ",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setProcessingReqNo(null);
      setProcessingAction(null);
    }
  }

  async function handleFinish(
    reqNo: string,
  ): Promise<void> {
    if (
      !assignment ||
      processingReqNo ||
      !reqNo.trim()
    ) {
      return;
    }

    const job =
      assignment.jobs.find(
        (item) =>
          item.reqNo === reqNo,
      );

    if (!job) {
      return;
    }

    try {
      setProcessingReqNo(reqNo);
      setProcessingAction("finish");

      const result =
        await finishPorterJob({
          staffNo,
          reqNo,
        });

      if (!result.success) {
        await Swal.fire({
          position: "top-end",
          toast: true,
          icon: "error",
          title:
            "บันทึกไม่สำเร็จ",
          text: result.message,
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
        });

        return;
      }

      const hasNextJobs =
        await reloadAssignment();

      await Swal.fire({
        position: "top-end",
        toast: true,
        icon: "success",
        title:
          `งาน ${reqNo} เสร็จสิ้นแล้ว`,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      if (!hasNextJobs) {
        goToDashboard();
      }
    } catch (error) {
      console.error(
        "Finish job error:",
        error,
      );

      await Swal.fire({
        position: "top-end",
        toast: true,
        icon: "error",
        title:
          "บันทึกไม่สำเร็จ",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setProcessingReqNo(null);
      setProcessingAction(null);
    }
  }

  if (!isReady) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "10px",
        background: "#eef3f8",
        fontFamily: 'Tahoma, "Noto Sans Thai", Arial, sans-serif',
      }}
    >
      <div style={{ width: "100%", maxWidth: "430px", margin: "0 auto" }}>
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              border: "3px solid #d7e6f3",
              borderTopColor: "#176fca",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>

        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    </main>
  );
}

  if (
    !assignment ||
    !assignment.jobs ||
    assignment.jobs.length === 0
  ) {
    return (
      <main
        style={
          styles.centerPage
        }
      >
        <section
          style={
            styles.messageCard
          }
        >
          <div
            style={
              styles.loadingIcon
            }
          >
            <ClockIcon
              size={27}
              color="#0d6fd1"
            />
          </div>

          <div
            style={
              styles.messageTitle
            }
          >
            ไม่พบงานที่กำลังดำเนินการ
          </div>

          <div
            style={
              styles.messageText
            }
          >
            กำลังกลับหน้ารายการงาน
          </div>
        </section>
      </main>
    );
  }

  const jobs =
    assignment.jobs;

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
          staffNo={
            assignment.staffNo
          }
          staffName={
            assignment.staffName
          }
          title="ระบบรับงานพนักงานเปล"
          subtitle="งานที่กำลังดำเนินการ"
        />

        {jobs.map((job) => {
          const isProcessing =
            processingReqNo ===
            job.reqNo;

          const isCancellingThis =
            isProcessing &&
            processingAction ===
              "cancel";

          const isFinishingThis =
            isProcessing &&
            processingAction ===
              "finish";

          return (
            <section
              key={job.reqNo}
              style={
                styles.jobCard
              }
            >
              <section
                style={
                  styles.statusCard
                }
              >
                <div
                  style={
                    styles.statusTop
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
                        styles.reqNo
                      }
                    >
                      {job.reqNo}
                    </div>

                    <div
                      style={
                        styles.assignedTime
                      }
                    >
                      <CalendarIcon
                        size={15}
                        color="#718498"
                      />

                      <span>
                        รับงานเมื่อ{" "}
                        {formatAssignedAt(
                          job.assignedAt,
                        )}
                      </span>
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
                    {getUrgencyIcon(
                      job.fastTrack,
                    )}

                    {job.fastTrackText ||
                      "ปกติ"}
                  </span>
                </div>

                {job.isHeadJob && (
                  <div
                    style={
                      styles.headJobBadge
                    }
                  >
                    งานที่หัวหน้าเวรมอบหมาย
                  </div>
                )}
              </section>

              <section
                style={
                  styles.routeCard
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
                        styles.routeValue
                      }
                    >
                      <BedIcon
                        size={21}
                        color="#2786d8"
                      />

                      <span>
                        {job.locSource ||
                          "-"}
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
                        styles.routeValue
                      }
                    >
                      <HospitalIcon
                        size={21}
                        color="#2eaa68"
                      />

                      <span>
                        {job.locDest ||
                          "-"}
                      </span>
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
                    icon={getEquipmentIcon(
                      job.equipment,
                    )}
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
                  styles.jobActionBar
                }
              >
                {!job.isHeadJob && (
                  <button
                    type="button"
                    style={{
                      ...styles.cancelButton,
                      ...(isProcessing
                        ? styles.disabledButton
                        : {}),
                    }}
                    disabled={
                      !!processingReqNo
                    }
                    onClick={() =>
                      void handleCancel(
                        job.reqNo,
                      )
                    }
                  >
                    {isCancellingThis
                      ? "กำลังยกเลิก..."
                      : "ยกเลิกเคสนี้"}
                  </button>
                )}

                <button
                  type="button"
                  style={{
                    ...styles.finishButton,
                    ...(isProcessing
                      ? styles.disabledButton
                      : {}),
                    ...(job.isHeadJob
                      ? styles.headFinishButton
                      : {}),
                  }}
                  disabled={
                    !!processingReqNo
                  }
                  onClick={() =>
                    void handleFinish(
                      job.reqNo,
                    )
                  }
                >
                  <CheckIcon
                    size={21}
                    color="#ffffff"
                  />

                  {isFinishingThis
                    ? "กำลังบันทึก..."
                    : "เสร็จสิ้นงาน"}
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  centerPage: {
    minHeight: "100vh",
    padding: "20px",
    display: "grid",
    placeItems: "center",
    background: "#eef3f8",
    fontFamily:
      'Tahoma, "Noto Sans Thai", Arial, sans-serif',
  },

  messageCard: {
    width: "min(390px, 100%)",
    padding: "28px",
    display: "grid",
    justifyItems: "center",
    gap: "9px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 8px 22px rgba(0,0,0,0.06)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  loadingIcon: {
    width: "50px",
    height: "50px",
    display: "grid",
    placeItems: "center",
    borderRadius: "15px",
    background: "#e8f3fd",
  },

  messageTitle: {
    color: "#17324d",
    fontSize: "17px",
    fontWeight: 700,
  },

  messageText: {
    color: "#718498",
    fontSize: "13px",
  },

  page: {
    minHeight: "100vh",
    padding: "10px",
    background: "#eef3f8",
    fontFamily:
      'Tahoma, "Noto Sans Thai", Arial, sans-serif',
  },

  container: {
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
    paddingBottom: "20px",
  },

  jobCard: {
    marginBottom: "14px",
  },

  statusCard: {
    marginBottom: "10px",
    padding: "14px",
    border:
      "1px solid #edf2f6",
    borderRadius: "17px",
    background: "#ffffff",
    boxShadow:
      "0 7px 20px rgba(0,0,0,0.05)",
  },

  statusTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "10px",
  },

  reqArea: {
    minWidth: 0,
    flex: 1,
    margin: 0,
    padding: 0,
  },

  urgencyBadge: {
    flex: "0 0 auto",
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    minHeight: "31px",
    padding: "5px 9px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: "center",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  },

  reqLabel: {
    margin: 0,
    marginBottom: "3px",
    color: "#7b8ea1",
    fontSize: "11px",
    lineHeight: 1.3,
  },

  reqNo: {
    margin: 0,
    color: "#0d5ca6",
    fontSize: "19px",
    fontWeight: 700,
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },

  assignedTime: {
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: "#718498",
    fontSize: "11px",
    lineHeight: 1.35,
  },

  headJobBadge: {
    marginTop: "9px",
    padding:
      "7px 10px",
    borderRadius: "9px",
    color: "#d97820",
    background: "#fff5e9",
    fontSize: "11px",
    fontWeight: 700,
  },

  routeCard: {
    marginBottom: "10px",
    padding: "14px",
    border:
      "1px solid #edf2f6",
    borderRadius: "17px",
    background: "#ffffff",
    boxShadow:
      "0 7px 20px rgba(0,0,0,0.05)",
  },

  routeRow: {
    minWidth: 0,
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
  },

  sourceMarker: {
    width: "14px",
    flex: "0 0 14px",
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },

  destinationMarker: {
    width: "14px",
    flex: "0 0 14px",
    display: "flex",
    justifyContent: "center",
  },

  sourceDot: {
    width: "9px",
    height: "9px",
    marginTop: "5px",
    zIndex: 2,
    borderRadius: "50%",
    background: "#2786d8",
    boxShadow:
      "0 0 0 3px #dfefff",
  },

  destinationDot: {
    width: "9px",
    height: "9px",
    marginTop: "5px",
    borderRadius: "50%",
    background: "#2eaa68",
    boxShadow:
      "0 0 0 3px #e0f4e8",
  },

  routeLine: {
    width: "2px",
    height: "48px",
    position: "absolute",
    top: "13px",
    background: "#ccd9e5",
  },

  routeContent: {
    minWidth: 0,
    flex: 1,
    paddingBottom: "16px",
  },

  routeContentLast: {
    minWidth: 0,
    flex: 1,
  },

  sourceLabel: {
    marginBottom: "4px",
    color: "#2475bd",
    fontSize: "11px",
  },

  destinationLabel: {
    marginBottom: "4px",
    color: "#2c9b61",
    fontSize: "11px",
  },

  routeValue: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#17324d",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },

  detailCard: {
    marginBottom: "10px",
    padding: "10px",
    border:
      "1px solid #edf2f6",
    borderRadius: "17px",
    background: "#ffffff",
    boxShadow:
      "0 7px 20px rgba(0,0,0,0.05)",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "9px",
  },

  detailItem: {
    minWidth: 0,
    padding: "11px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border:
      "1px solid #e5edf5",
    borderRadius: "12px",
    background: "#f8fbfe",
  },

  detailItemFull: {
    gridColumn: "1 / -1",
  },

  detailIcon: {
    width: "34px",
    height: "34px",
    flex: "0 0 34px",
    display: "grid",
    placeItems: "center",
    borderRadius: "10px",
    background: "#e8f3fd",
  },

  detailText: {
    minWidth: 0,
    flex: 1,
  },

  detailLabel: {
    marginBottom: "3px",
    color: "#7b8ea1",
    fontSize: "10px",
  },

  detailValue: {
    color: "#17324d",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },

  jobActionBar: {
    padding: "10px",
    display: "grid",
    gridTemplateColumns:
      "1fr 1.35fr",
    gap: "9px",
    borderRadius: "17px",
    background: "#ffffff",
    boxShadow:
      "0 7px 20px rgba(0,0,0,0.05)",
  },

  headFinishButton: {
    gridColumn: "1 / -1",
  },

  cancelButton: {
    minHeight: "49px",
    padding: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border:
      "1px solid #e6a9a9",
    borderRadius: "13px",
    color: "#bd3333",
    background: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  finishButton: {
    minHeight: "49px",
    padding: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: 0,
    borderRadius: "13px",
    color: "#ffffff",
    background: "#23885a",
    boxShadow:
      "0 7px 17px rgba(35,136,90,0.25)",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};