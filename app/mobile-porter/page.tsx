import PorterDashboard from "@/components/porter-dashboard";

import {
  getFinishedJobs,
  getStaffDisplayName,
  getWaitingJobs,
} from "@/lib/porter";

export const dynamic = "force-dynamic";

type DashboardView =
  | "active"
  | "finished";

type PageProps = {
  searchParams: Promise<{
    userid?: string;
    view?: string;
  }>;
};

export default async function MobilePorterPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const staffNo = String(
    params.userid ?? "",
  ).trim();

  const viewMode: DashboardView =
    params.view === "finished"
      ? "finished"
      : "active";

  const [staffName, jobs] =
    await Promise.all([
      getStaffDisplayName(staffNo),

      viewMode === "finished"
        ? getFinishedJobs(staffNo)
        : getWaitingJobs(),
    ]);

  return (
    <PorterDashboard
      staffNo={staffNo}
      staffName={staffName}
      jobs={jobs}
      viewMode={viewMode}
    />
  );
}