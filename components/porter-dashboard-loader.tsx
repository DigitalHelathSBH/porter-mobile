"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useRouter } from "next/navigation";
import {
  dashboardCacheKey,
  getDashboardSnapshot,
  getServerDashboardSnapshot,
  saveDashboardSnapshot,
  subscribeDashboardCache,
} from "@/lib/porter-dashboard-cache";

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
  expectedStaffNo: string;
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

export default function PorterDashboardLoader({
  viewMode,
  expectedStaffNo,
}: Props) {
  const router = useRouter();
  const key = dashboardCacheKey(expectedStaffNo, viewMode);
  const getSnapshot = useCallback(() => getDashboardSnapshot(key), [key]);
  const snapshot = useSyncExternalStore(subscribeDashboardCache, getSnapshot, getServerDashboardSnapshot);
  const requestRef = useRef<AbortController | null>(null);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadDashboard =
    useCallback(
      async (
        silent = false,
      ): Promise<void> => {
        if (requestRef.current) return;
        const controller = new AbortController();
        requestRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 75_000);
        try {
          setErrorMessage("");

          const response =
            await fetch(
              "/api/porter/dashboard",
              {
                method: "POST",

                cache: "no-store",
                signal: controller.signal,

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

          if (requestRef.current !== controller) return;

          /*
           * Session หมด
           */
          if (
            response.status === 401
          ) {
            router.replace("/mobile-porter/login");

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

          if (nextStaffNo.toUpperCase() !== expectedStaffNo.trim().toUpperCase()) {
            router.refresh();
            return;
          }

          /*
           * รายการงาน
           */
          const nextJobs =
            Array.isArray(
              result.jobs,
            )
              ? result.jobs
              : [];


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

          const assignment = result.currentAssignment as { jobs?: PorterJob[] } | null | undefined;
          saveDashboardSnapshot(key, {
            staffNo: nextStaffNo,
            staffName: nextStaffName,
            jobs: nextJobs,
            alertJobs: nextAlertJobs,
            hasActiveJob: (assignment?.jobs?.length ?? 0) > 0,
          });
        } catch (error) {
          if (requestRef.current !== controller) return;
          console.warn(
            "loadDashboard error:",
            error,
          );

          /*
           * Auto Refresh
           *
           * ไม่เปลี่ยนหน้าจอเป็น Error
           * และเก็บข้อมูลเดิมเอาไว้
           */
          if (!silent || !getDashboardSnapshot(key)) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "โหลดข้อมูลไม่สำเร็จ",
            );
          }
        } finally {
          window.clearTimeout(timeout);
          if (requestRef.current === controller) requestRef.current = null;
        }
      },
      [
        viewMode,
        expectedStaffNo,
        key,
        router,
      ],
    );

  /*
 * โหลดครั้งแรก
 *
 * แสดงข้อมูลล่าสุดที่มีทันที แล้วตรวจข้อมูลใหม่เบื้องหลัง
 * ถ้ายังไม่เคยโหลดสำเร็จ ให้รอข้อมูลแทนการแสดงรายการว่าง
 */
useEffect(
  () => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboard(Boolean(getDashboardSnapshot(key)));
    }, 0);
    return () => {
      window.clearTimeout(initialLoad);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  },
  [
    loadDashboard,
    key,
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
  if (!snapshot && !errorMessage) {
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
  if (!snapshot) {
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
      staffNo={snapshot.staffNo}
      staffName={snapshot.staffName}
      jobs={snapshot.jobs}
      alertJobs={snapshot.alertJobs}
      allowNewJobAlerts={!snapshot.hasActiveJob}
      viewMode={viewMode}
    />
  );
}
