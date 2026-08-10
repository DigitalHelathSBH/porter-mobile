"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function PorterLoginPage() {
  const router = useRouter();

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    const normalizedEmpId = empId.trim();
    const normalizedPassword = password.trim();

    // =========================
    // ตรวจรหัสเจ้าหน้าที่
    // =========================
    if (!normalizedEmpId) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสเจ้าหน้าที่",
        confirmButtonText: "ตกลง",
      });

      return;
    }

    // =========================
    // ตรวจรหัสผ่าน
    // =========================
    if (!normalizedPassword) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสผ่าน",
        confirmButtonText: "ตกลง",
      });

      return;
    }

    try {
      setIsLoading(true);

      // =========================
      // ส่งข้อมูลไป Login API
      // =========================
      const response = await fetch(
        "/api/mobile-porter/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            empId: normalizedEmpId,
            password: normalizedPassword,
          }),
        }
      );

      const result = await response.json();

      // =========================
      // Login ไม่ผ่าน
      // =========================
      if (!response.ok || !result.success) {
        await Swal.fire({
          icon: "error",
          title:
            result.message ??
            "เข้าสู่ระบบไม่สำเร็จ",
          confirmButtonText: "ตกลง",
        });

        return;
      }

      // =========================
      // Login สำเร็จ
      // =========================
      router.replace(
        `/mobile-porter?userid=${encodeURIComponent(
          result.staffNo
        )}`
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถติดต่อระบบได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        background: "#eef3f8",
        fontFamily:
          'Tahoma, "Noto Sans Thai", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "min(390px, 100%)",
          padding: "28px 24px",
          borderRadius: "22px",
          background: "#ffffff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
        }}
      >
        {/* =====================
            หัวข้อ
        ===================== */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 14px",
              display: "grid",
              placeItems: "center",
              borderRadius: "18px",
              background: "#e8f3fd",
              fontSize: "30px",
            }}
          >
            🚑
          </div>

          <div
            style={{
              color: "#0d5ca6",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            ระบบรับงานพนักงานเปล
          </div>

          <div
            style={{
              marginTop: "7px",
              color: "#718498",
              fontSize: "13px",
            }}
          >
            กรุณากรอกรหัสเจ้าหน้าที่และรหัสผ่าน
          </div>
        </div>

        {/* =====================
            รหัสเจ้าหน้าที่
        ===================== */}
        <label
          htmlFor="empId"
          style={{
            display: "block",
            marginBottom: "7px",
            color: "#526679",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          รหัสเจ้าหน้าที่
        </label>

        <input
          id="empId"
          type="text"
          value={empId}
          onChange={(event) => {
            setEmpId(event.target.value);
          }}
          placeholder="เช่น L0281"
          autoFocus
          autoComplete="username"
          disabled={isLoading}
          style={{
            width: "100%",
            height: "50px",
            padding: "0 14px",
            border: "1px solid #cbd8e5",
            borderRadius: "12px",
            outline: "none",
            color: "#17324d",
            background: "#ffffff",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

        {/* =====================
            Password
        ===================== */}
        <label
          htmlFor="password"
          style={{
            display: "block",
            marginTop: "16px",
            marginBottom: "7px",
            color: "#526679",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          รหัสผ่าน
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleLogin();
            }
          }}
          placeholder="กรอกรหัสผ่าน"
          autoComplete="current-password"
          disabled={isLoading}
          style={{
            width: "100%",
            height: "50px",
            padding: "0 14px",
            border: "1px solid #cbd8e5",
            borderRadius: "12px",
            outline: "none",
            color: "#17324d",
            background: "#ffffff",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

        {/* =====================
            ปุ่ม Login
        ===================== */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            void handleLogin();
          }}
          style={{
            width: "100%",
            minHeight: "50px",
            marginTop: "20px",
            border: 0,
            borderRadius: "12px",
            color: "#ffffff",
            background: "#0d6fd1",
            fontSize: "15px",
            fontWeight: 700,
            cursor: isLoading
              ? "not-allowed"
              : "pointer",
            opacity: isLoading ? 0.65 : 1,
          }}
        >
          {isLoading
            ? "กำลังตรวจสอบ..."
            : "เข้าสู่ระบบ"}
        </button>
      </div>
    </main>
  );
}