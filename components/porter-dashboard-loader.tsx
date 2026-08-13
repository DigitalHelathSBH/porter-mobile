"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import PorterDashboard
  from "@/components/porter-dashboard";

import type {
  PorterJob,
} from "@/types/porter";

type DashboardView =
  | "active"
  | "finished";

type Props = {
  viewMode: DashboardView;
};

type DashboardApiResponse = {
  success?: boolean;
  message?: string;

  staffNo?: string;
  staffName?: string;

  jobs?: PorterJob[];
};

export default function PorterDashboardLoader({
  viewMode,
}: Props) {
  const router =
    useRouter();

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    staffNo,
    setStaffNo,
  ] = useState("");

  const [
    staffName,
    setStaffName,
  ] = useState("");

  const [
    jobs,
    setJobs,
  ] = useState<PorterJob[]>([]);

  /**
   * โหลดข้อมูล Dashboard
   *
   * ใช้ POST เท่านั้น
   *
   * ไม่ส่ง staffNo จาก Client
   * เพราะ API จะอ่าน porterStaffNo
   * จาก HttpOnly Cookie เอง
   */
  const loadDashboard =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setErrorMessage("");

          const response =
            await fetch(
              "/api/porter/dashboard",
              {
                method: "POST",

                cache: "no-store",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Cache-Control":
                    "no-cache",
                },

                body:
                  JSON.stringify({
                    view:
                      viewMode,
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

          /**
           * Session หมด
           * หรือยังไม่ได้ Login
           */
          if (
            response.status === 401
          ) {
            router.replace(
              "/mobile-porter/login",
            );

            return;
          }

          /**
           * API Error
           */
          if (
            !response.ok
            || !result.success
          ) {
            throw new Error(
              result.message
              ?? "โหลดข้อมูลไม่สำเร็จ",
            );
          }

          setStaffNo(
            String(
              result.staffNo
              ?? "",
            ).trim(),
          );

          setStaffName(
            String(
              result.staffName
              ?? "",
            ).trim(),
          );

          setJobs(
            Array.isArray(
              result.jobs,
            )
              ? result.jobs
              : [],
          );
        } catch (error) {
          console.error(
            "loadDashboard error:",
            error,
          );

          setErrorMessage(
            error
              instanceof Error
              ? error.message
              : "โหลดข้อมูลไม่สำเร็จ",
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        router,
        viewMode,
      ],
    );

  /**
   * โหลดข้อมูลเมื่อเปิดหน้า
   * หรือเปลี่ยน active / finished
   */
  useEffect(
    () => {
      void loadDashboard();
    },
    [
      loadDashboard,
    ],
  );

  /**
   * Loading
   */
  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",

          display: "grid",
          placeItems: "center",

          padding: "20px",

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

  /**
   * Error
   */
  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",

          display: "grid",
          placeItems: "center",

          padding: "20px",

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

  /**
   * แสดง Dashboard เดิม
   */
  return (
    <PorterDashboard
      staffNo={staffNo}
      staffName={staffName}
      jobs={jobs}
      viewMode={viewMode}
    />
  );
}