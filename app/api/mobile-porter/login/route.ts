import { NextResponse } from "next/server";
import * as sql from "mssql";

import { getDb } from "@/lib/db";
import { getStaffDisplayName } from "@/lib/porter";

type EmpLoginRow = {
  EmpID: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const empId = String(body.empId ?? "").trim();
    const password = String(body.password ?? "").trim();

    // =========================
    // ตรวจสอบข้อมูลที่กรอก
    // =========================
    if (!empId) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกรหัสเจ้าหน้าที่",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกรหัสผ่าน",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // เชื่อมต่อ Database
    // =========================
    const pool = await getDb();

    // =========================
    // ตรวจสอบ EmpID + Password
    // จาก Database Saraburi
    // =========================
    const result = await pool
      .request()
      .input(
        "EmpID",
        sql.VarChar(50),
        empId
      )
      .input(
        "Password",
        sql.VarChar(255),
        password
      )
      .query(`
        SELECT TOP 1
            CONVERT(varchar(50), EmpID) AS EmpID
        FROM Saraburi.dbo.Emp
        WHERE LTRIM(RTRIM(CONVERT(varchar(50), EmpID))) = @EmpID
        AND LTRIM(RTRIM(CONVERT(varchar(255), [Password]))) = @Password
      `);

    const employee = result.recordset[0] as
      | EmpLoginRow
      | undefined;

    // =========================
    // ไม่พบผู้ใช้งาน
    // =========================
    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสเจ้าหน้าที่หรือรหัสผ่านไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    const staffNo = String(
      employee.EmpID ?? empId
    ).trim();

    // =========================
    // ดึงชื่อเจ้าหน้าที่
    // =========================
    let staffName = "";

    try {
      staffName =
        await getStaffDisplayName(staffNo);
    } catch (error) {
      console.error(
        "Load staff name error:",
        error
      );
    }

    // =========================
    // Login สำเร็จ
    // =========================
    return NextResponse.json({
      success: true,
      staffNo,
      staffName,
    });
  } catch (error) {
    console.error(
      "Porter login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      },
      {
        status: 500,
      }
    );
  }
}