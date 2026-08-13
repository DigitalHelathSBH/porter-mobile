"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import PorterDetail
  from "@/components/porter-detail";

import type {
  PorterJob,
} from "@/types/porter";

type Props = {
  reqNo: string;
};

type JobDetailApiResponse = {
  success?: boolean;
  message?: string;

  staffNo?: string;
  staffName?: string;

  job?: PorterJob | null;
};

export default function PorterDetailLoader({
  reqNo,
}: Props) {
  const router =
    useRouter();

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    staffNo,
    setStaffNo,
  ] =
    useState("");

  const [
    staffName,
    setStaffName,
  ] =
    useState("");

  const [
    job,
    setJob,
  ] =
    useState<PorterJob | null>(
      null,
    );

  useEffect(() => {
    let isDisposed =
      false;

    async function loadJobDetail(): Promise<void> {
      try {
        setIsLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        // =========================
        // โหลดรายละเอียดงาน
        // ผ่าน POST API เท่านั้น
        // =========================
        const response =
          await fetch(
            "/api/porter/job-detail",
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
                  reqNo,
                }),
            },
          );

        let result:
          JobDetailApiResponse;

        try {
          result =
            (
              await response.json()
            ) as JobDetailApiResponse;
        } catch {
          throw new Error(
            `API ตอบกลับไม่ถูกต้อง (${response.status})`,
          );
        }

        if (
          isDisposed
        ) {
          return;
        }

        // =========================
        // Session หมด
        // =========================
        if (
          response.status
          === 401
        ) {
          router.replace(
            "/mobile-porter/login",
          );

          return;
        }

        // =========================
        // ไม่พบงาน
        // =========================
        if (
          response.status
          === 404
        ) {
          setJob(
            null,
          );

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

          setErrorMessage(
            result.message
            ?? "ไม่พบรายการงาน",
          );

          return;
        }

        // =========================
        // API Error
        // =========================
        if (
          !response.ok
          || !result.success
        ) {
          throw new Error(
            result.message
            ?? "โหลดรายละเอียดงานไม่สำเร็จ",
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

        setJob(
          result.job
          ?? null,
        );
      } catch (error) {
        console.error(
          "loadJobDetail error:",
          error,
        );

        if (
          !isDisposed
        ) {
          setErrorMessage(
            error
              instanceof Error
              ? error.message
              : "โหลดรายละเอียดงานไม่สำเร็จ",
          );
        }
      } finally {
        if (
          !isDisposed
        ) {
          setIsLoading(
            false,
          );
        }
      }
    }

    void loadJobDetail();

    return () => {
      isDisposed =
        true;
    };
  }, [
    reqNo,
    router,
  ]);

  // =========================
  // Loading
  // =========================
  if (
    isLoading
  ) {
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
          กำลังโหลดรายละเอียดงาน...
        </div>
      </main>
    );
  }

  // =========================
  // Error / ไม่พบงาน
  // =========================
  if (
    errorMessage
    || !job
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          padding:
            "20px",

          display:
            "grid",

          placeItems:
            "center",

          background:
            "#eef3f8",

          fontFamily:
            'Tahoma, "Noto Sans Thai", Arial, sans-serif',
        }}
      >
        <div
          style={{
            width:
              "min(520px, 100%)",

            padding:
              "28px",

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
              marginBottom:
                "8px",

              color:
                "#17324d",

              fontSize:
                "20px",

              fontWeight:
                700,
            }}
          >
            ไม่พบรายการงาน
          </div>

          <div
            style={{
              marginBottom:
                "20px",

              color:
                "#708396",

              fontSize:
                "13px",

              lineHeight:
                1.6,
            }}
          >
            {
              errorMessage
              || (
                "งานนี้อาจมีพนักงานคนอื่นรับไปแล้ว "
                + "หรือข้อมูลมีการเปลี่ยนแปลง"
              )
            }
          </div>

          <button
            type="button"
            onClick={() => {
              router.replace(
                "/mobile-porter",
              );
            }}
            style={{
              minHeight:
                "44px",

              padding:
                "10px 20px",

              border:
                0,

              borderRadius:
                "11px",

              color:
                "#ffffff",

              background:
                "#0d6fd1",

              fontFamily:
                "inherit",

              fontSize:
                "14px",

              fontWeight:
                700,

              cursor:
                "pointer",
            }}
          >
            ย้อนกลับ
          </button>
        </div>
      </main>
    );
  }

  // =========================
  // แสดงรายละเอียดงานจริง
  // =========================
  return (
    <PorterDetail
      job={job}
      staffNo={staffNo}
      staffName={staffName}
    />
  );
}