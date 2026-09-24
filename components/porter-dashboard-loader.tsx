"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import PorterDashboard
  from "@/components/porter-dashboard";

import type {
  PorterJob,
} from "@/types/porter";

type DashboardView =
  | "ศูนย์เปล ER"
  | "ศูนย์เปล OPD"
  | "finished";

type Props = {
  viewMode: DashboardView;
};

type DashboardApiResponse = {
  success?: boolean;
  message?: string;
  staffNo?: string;
  staffName?: string;
  currentAssignment?: unknown | null;
  jobs?: PorterJob[];
  alertJobs?: PorterJob[];
};

const DASHBOARD_LOADED_KEY = "porterDashboardLoadedOnce";

function hasDashboardLoadedBefore(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(DASHBOARD_LOADED_KEY) === "1"
    );
  } catch {
    return false;
  }
}

function markDashboardLoaded(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(DASHBOARD_LOADED_KEY, "1");
  } catch {
    // ไม่ต้องทำอะไร ถ้า sessionStorage ใช้ไม่ได้
  }
}

export default function PorterDashboardLoader({
  viewMode,
}: Props) {
  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [staffNo, setStaffNo] =
    useState("");

  const [staffName, setStaffName] =
    useState("");

  const [jobs, setJobs] =
    useState<PorterJob[]>([]);

  const [alertJobs, setAlertJobs] =
    useState<PorterJob[]>([]);

  const loadDashboard =
    useCallback(
      async (
        silent = false,
      ): Promise<void> => {
        try {
          if (!silent) {
            setIsLoading(true);
          }

          setErrorMessage("");

          const response =
            await fetch(
              "/api/porter/dashboard",
              {
                method: "POST",

                cache: "no-store",

                credentials:
                  "same-origin",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Cache-Control":
                    "no-cache",

                  "Pragma":
                    "no-cache",
                },

                body: JSON.stringify({
                  view: viewMode,
                }),
              },
            );

          let result:
            DashboardApiResponse;

          try {
            result =
              (
                await response.json()
              ) as DashboardApiResponse;
          } catch {
            throw new Error(
              `API ตอบกลับไม่ถูกต้อง (${response.status})`,
            );
          }

          /*
           * Session หมด
           */
          if (
            response.status === 401
          ) {
            window.location.href =
              "/mobile-porter/login";

            return;
          }

          /*
           * API Error
           */
          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ??
                "โหลดข้อมูลไม่สำเร็จ",
            );
          }

          /*
           * สำคัญ:
           *
           * ไม่ Redirect ไป Current
           * จาก currentAssignment ตรงนี้
           *
           * เพราะงานหัวหน้าต้องผ่าน
           * PorterHeadJobMonitor ก่อน
           *
           * Monitor จะเป็นตัวจัดการ:
           *
           * ไม่มีงาน Active
           * -> Alert
           * -> Activate
           * -> Current
           *
           * มีงาน Active อยู่
           * -> Alert อย่างเดียว
           * -> ไม่เปลี่ยนหน้า
           */

          /*
           * พนักงาน
           */
          const nextStaffNo =
            String(
              result.staffNo ??
                "",
            ).trim();

          const nextStaffName =
            String(
              result.staffName ??
                "",
            ).trim();

          setStaffNo(
            nextStaffNo,
          );

          setStaffName(
            nextStaffName,
          );

          /*
           * รายการงาน
           */
          const nextJobs =
            Array.isArray(
              result.jobs,
            )
              ? result.jobs
              : [];

          setJobs(
            nextJobs,
          );

          /*
           * งานสำหรับแจ้งเตือน
           *
           * API สามารถส่ง alertJobs
           * แยกออกมาจาก jobs ได้
           *
           * ถ้า API ยังไม่ได้ส่ง
           * alertJobs ให้ใช้ jobs แทน
           */
          const nextAlertJobs =
            Array.isArray(
              result.alertJobs,
            )
              ? result.alertJobs
              : nextJobs;

          setAlertJobs(
            nextAlertJobs,
          );
        } catch (error) {
          console.error(
            "loadDashboard error:",
            error,
          );

          /*
           * Auto Refresh
           *
           * ไม่เปลี่ยนหน้าจอเป็น Error
           * และเก็บข้อมูลเดิมเอาไว้
           */
          if (!silent) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "โหลดข้อมูลไม่สำเร็จ",
            );
          }
        } finally {
          if (!silent) {
            setIsLoading(false);
          }
        }
      },
      [
        viewMode,
      ],
    );

  /*
 * โหลดครั้งแรก
 *
 * ครั้งแรกสุดของแอป -> โชว์จอ "กำลังโหลด"
 * ครั้งต่อๆ ไป (สลับแท็บ) -> โหลดเงียบๆ ไม่ขึ้นจอ loading
 */
useEffect(
  () => {
    const isFirstLoad = !hasDashboardLoadedBefore();
    markDashboardLoaded();

    if (!isFirstLoad) {
      /*
       * เคยโหลดมาก่อนแล้วในเซสชันนี้
       * ข้ามจอ loading เต็มจอทันที
       */
      setIsLoading(false);
    }

    void loadDashboard(!isFirstLoad);
  },
  [
    loadDashboard,
  ],
);

  /*
   * Auto Refresh ทุก 30 วินาที
   */
  useEffect(
    () => {
      let isDisposed =
        false;

      async function refreshDashboard(): Promise<void> {
        if (isDisposed) {
          return;
        }

        /*
         * ถ้าไม่ได้เปิดหน้าอยู่
         * ไม่ต้องยิง API
         */
        if (
          document.visibilityState !==
          "visible"
        ) {
          return;
        }

        await loadDashboard(
          true,
        );
      }

      const timer =
        window.setInterval(
          () => {
            void refreshDashboard();
          },
          30_000,
        );

      /*
       * กลับมาเปิดหน้า
       * โหลดข้อมูลทันที
       */
      function handleVisibilityChange(): void {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void refreshDashboard();
        }
      }

      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      return () => {
        isDisposed = true;

        window.clearInterval(
          timer,
        );

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    },
    [
      loadDashboard,
    ],
  );

  /*
   * Loading ครั้งแรก
   */
  if (isLoading) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          display:
            "grid",

          placeItems:
            "center",

          padding:
            "20px",

          background:
            "#eef3f8",

          fontFamily:
            'Tahoma, "Noto Sans Thai", Arial, sans-serif',
        }}
      >
        <div
          style={{
            color:
              "#60758a",

            fontSize:
              "14px",

            fontWeight:
              700,
          }}
        >
          กำลังโหลดข้อมูล...
        </div>
      </main>
    );
  }

  /*
   * Error
   */
  if (errorMessage) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          display:
            "grid",

          placeItems:
            "center",

          padding:
            "20px",

          background:
            "#eef3f8",

          fontFamily:
            'Tahoma, "Noto Sans Thai", Arial, sans-serif',
        }}
      >
        <div
          style={{
            width:
              "min(420px, 100%)",

            padding:
              "24px",

            borderRadius:
              "18px",

            background:
              "#ffffff",

            boxShadow:
              "0 10px 28px rgba(0,0,0,0.08)",

            textAlign:
              "center",

            boxSizing:
              "border-box",
          }}
        >
          <div
            style={{
              color:
                "#c0392b",

              fontSize:
                "17px",

              fontWeight:
                700,
            }}
          >
            โหลดข้อมูลไม่สำเร็จ
          </div>

          <div
            style={{
              marginTop:
                "8px",

              color:
                "#718498",

              fontSize:
                "13px",

              lineHeight:
                1.6,
            }}
          >
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={() => {
              void loadDashboard();
            }}
            style={{
              minHeight:
                "42px",

              marginTop:
                "18px",

              padding:
                "9px 18px",

              border:
                0,

              borderRadius:
                "10px",

              color:
                "#ffffff",

              background:
                "#0d6fd1",

              fontFamily:
                "inherit",

              fontSize:
                "13px",

              fontWeight:
                700,

              cursor:
                "pointer",
            }}
          >
            ลองใหม่
          </button>
        </div>
      </main>
    );
  }

  /*
   * Dashboard
   */
  return (
    <PorterDashboard
      staffNo={staffNo}
      staffName={staffName}
      jobs={jobs}
      alertJobs={alertJobs}
      viewMode={viewMode}
    />
  );
}