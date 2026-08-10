import Link from "next/link";

import PorterDetail from "@/components/porter-detail";

import {
  getStaffDisplayName,
  getWaitingJobs,
} from "@/lib/porter";

type PageProps = {
  params: Promise<{
    reqNo: string;
  }>;

  searchParams: Promise<{
    userid?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PorterJobDetailPage({
  params,
  searchParams,
}: PageProps) {
  const routeParams = await params;
  const queryParams = await searchParams;

  const reqNo =
    String(routeParams.reqNo ?? "").trim();

  const staffNo =
    String(queryParams.userid ?? "").trim();

  const [jobs, staffName] = await Promise.all([
    getWaitingJobs(),
    getStaffDisplayName(staffNo),
  ]);

  const job = jobs.find(
    (item) =>
      item.reqNo.toLowerCase()
      === reqNo.toLowerCase(),
  );

  if (!job) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "20px",
          display: "grid",
          placeItems: "center",
          background: "#eef3f8",
          fontFamily: "Tahoma, sans-serif",
        }}
      >
        <div
          style={{
            width: "min(520px, 100%)",
            padding: "28px",
            borderRadius: "18px",
            background: "#ffffff",
            boxShadow:
              "0 10px 28px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: "8px",
              color: "#17324d",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            ไม่พบรายการงาน
          </div>

          <div
            style={{
              marginBottom: "20px",
              color: "#708396",
            }}
          >
            งานนี้อาจมีพนักงานคนอื่นรับไปแล้ว
            หรือข้อมูลมีการเปลี่ยนแปลง
          </div>

          <Link
            href={
              `/mobile-porter?userid=`
              + encodeURIComponent(staffNo)
            }
            style={{
              display: "inline-block",
              padding: "11px 20px",
              borderRadius: "11px",
              color: "#ffffff",
              background: "#0d6fd1",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ย้อนกลับ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <PorterDetail
      job={job}
      staffNo={staffNo}
      staffName={staffName}
    />
  );
}