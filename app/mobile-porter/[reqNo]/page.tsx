import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPorterJobDetailDb, getStaffDisplayName } from "@/lib/porter";
import PorterJobDetail from "@/components/porter-job-detail";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params, searchParams }: {
  params: Promise<{ reqNo: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const cookieStore = await cookies();
  const staffNo = String(cookieStore.get("porterStaffNo")?.value ?? "").trim();
  if (!staffNo) redirect("/mobile-porter/login");
  const { reqNo } = await params;
  const { view } = await searchParams;
  const validView = view === "ศูนย์เปล OPD" || view === "ศูนย์เปล ER" || view === "finished" ? view : "ศูนย์เปล IPD";
  const [job, staffName] = await Promise.all([getPorterJobDetailDb(reqNo, staffNo), getStaffDisplayName(staffNo)]);
  return <PorterJobDetail job={job} staffNo={staffNo} staffName={staffName} view={validView} />;
}
