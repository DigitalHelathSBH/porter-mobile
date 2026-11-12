"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Swal from "sweetalert2";

import {
  AmbulanceIcon,
} from "@/components/porter-icons";

type Props = {
  staffNo: string;
  staffName: string;

  title?: string;
  subtitle?: string;

  showBack?: boolean;
  showLogout?: boolean;
  compact?: boolean;
};

export default function PorterHeader({
  staffNo,
  staffName,
  title = "ระบบรับงานพนักงานเปล",
  subtitle = "รายการงานรอรับ",
  showBack = false,
  showLogout = false,
  compact = false,
}: Props) {
  const router =
    useRouter();

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] =
    useState(false);

  const staffDisplay =
    staffNo
      ? (
        `(${staffNo})${
          staffName
            ? ` ${staffName}`
            : ""
        }`
      )
      : "-";

  async function handleLogout(): Promise<void> {
    if (
      isLoggingOut
    ) {
      return;
    }

    try {
      setIsLoggingOut(
        true,
      );

      // =========================
      // Logout ผ่าน POST API
      // เพื่อให้ Server ลบ httpOnly Cookie
      // =========================
      const response =
        await fetch(
          "/api/mobile-porter/logout",
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
              JSON.stringify({}),
          },
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `Logout API error (${response.status})`,
        );
      }

      // =========================
      // ล้าง sessionStorage เก่า
      // เผื่อยังมีค่าจากเวอร์ชันก่อนหน้า
      // =========================
      window.sessionStorage.removeItem(
        "porterStaffNo",
      );

      window.sessionStorage.removeItem(
        "porterStaffName",
      );

      // =========================
      // กลับหน้า Login
      // =========================
      router.replace(
        "/mobile-porter/login",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
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
          "ออกจากระบบไม่สำเร็จ",

        text:
          "กรุณาลองใหม่อีกครั้ง",

        showConfirmButton:
          false,

        timer:
          2200,

        timerProgressBar:
          true,
      });
    } finally {
      setIsLoggingOut(
        false,
      );
    }
  }

  function handleBack(): void {
    router.back();
  }

  return (
    <header
      style={{
        marginBottom:
          "12px",

        padding:
          compact ? "10px 12px" : "16px",

        borderRadius:
          "18px",

        color:
          "#ffffff",

        background:
          "linear-gradient(135deg, #0d5ca6, #1b77c8)",

        boxShadow:
          "0 8px 22px rgba(13,92,166,0.18)",
      }}
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            compact ? "8px" : "11px",
        }}
      >
        {showBack ? (
          <button
            type="button"
            onClick={
              handleBack
            }
            aria-label="ย้อนกลับ"
            style={{
              width:
                compact ? "34px" : "46px",

              height:
                compact ? "34px" : "46px",

              display:
                "grid",

              placeItems:
                "center",

              border:
                "1px solid rgba(255,255,255,0.28)",

              borderRadius:
                "14px",

              color:
                "#ffffff",

              background:
                "rgba(255,255,255,0.13)",

              fontSize:
                "28px",

              cursor:
                "pointer",
            }}
          >
            ‹
          </button>
        ) : (
          <div
            style={{
              width:
                compact ? "34px" : "46px",

              height:
                compact ? "34px" : "46px",

              flex:
                compact ? "0 0 34px" : "0 0 46px",

              display:
                "grid",

              placeItems:
                "center",

              border:
                "1px solid rgba(255,255,255,0.24)",

              borderRadius:
                "14px",

              background:
                "rgba(255,255,255,0.15)",
            }}
          >
            <AmbulanceIcon
              size={compact ? 23 : 30}
              color="#ffffff"
            />
          </div>
        )}

        <div
          style={{
            minWidth:
              0,

            flex:
              1,
          }}
        >
          <div
            style={{
              fontSize:
                compact ? "15px" : "19px",

              fontWeight:
                700,

              lineHeight:
                1.35,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop:
                "3px",

              fontSize:
                compact ? "10px" : "12px",

              opacity:
                0.88,
            }}
          >
            {subtitle}
          </div>
        </div>

        {showLogout && (
          <button
            type="button"
            disabled={
              isLoggingOut
            }
            onClick={() => {
              void handleLogout();
            }}
            style={{
              flex:
                "0 0 auto",

              minHeight:
                "34px",

              padding:
                "6px 10px",

              border:
                "1px solid rgba(255,255,255,0.42)",

              borderRadius:
                "9px",

              color:
                "#ffffff",

              background:
                "rgba(255,255,255,0.13)",

              fontFamily:
                "inherit",

              fontSize:
                "11px",

              fontWeight:
                700,

              cursor:
                isLoggingOut
                  ? "not-allowed"
                  : "pointer",

              opacity:
                isLoggingOut
                  ? 0.65
                  : 1,
            }}
          >
            {
              isLoggingOut
                ? "กำลังออก..."
                : "ออกจากระบบ"
            }
          </button>
        )}
      </div>

      <div
        title={
          staffDisplay
        }
        style={{
          width:
            "100%",

          marginTop:
            compact ? "7px" : "12px",

          padding:
            compact ? "5px 8px" : "9px 11px",

          overflow:
            "hidden",

          border:
            "1px solid rgba(255,255,255,0.12)",

          borderRadius:
            "11px",

          background:
            "rgba(255,255,255,0.18)",

          fontSize:
            compact ? "11px" : "13px",

          fontWeight:
            700,

          whiteSpace:
            "nowrap",

          textOverflow:
            "ellipsis",

          boxSizing:
            "border-box",
        }}
      >
        {staffDisplay}
      </div>
    </header>
  );
}
