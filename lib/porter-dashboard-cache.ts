import type { PorterJob } from "@/types/porter";

export type DashboardSnapshot = {
  staffNo: string;
  staffName: string;
  jobs: PorterJob[];
  alertJobs: PorterJob[];
  hasActiveJob: boolean;
};

// Keep the last successful response while navigating within this app.
// Do not persist job details to browser storage.
const snapshots = new Map<string, DashboardSnapshot>();
const listeners = new Set<() => void>();

export function dashboardCacheKey(staffNo: string, view: string): string {
  return JSON.stringify([staffNo.trim().toUpperCase(), view]);
}

export function getDashboardSnapshot(key: string): DashboardSnapshot | null {
  return snapshots.get(key) ?? null;
}

export function saveDashboardSnapshot(key: string, snapshot: DashboardSnapshot): void {
  snapshots.set(key, snapshot);
  listeners.forEach(listener => listener());
}

export function subscribeDashboardCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getServerDashboardSnapshot(): null {
  return null;
}

/** Remove stale waiting cards across both centers after an accept/conflict. */
export function removeWaitingDashboardJob(staffNo: string, reqNo: string | null, hasActiveJob = false): void {
  const staff = staffNo.trim().toUpperCase();
  for (const [key, snapshot] of snapshots) {
    if (snapshot.staffNo.trim().toUpperCase() !== staff) continue;
    const [, view] = JSON.parse(key) as [string, string];
    snapshots.set(key, {
      ...snapshot,
      jobs: view === "finished" || !reqNo ? snapshot.jobs : snapshot.jobs.filter(job => job.reqNo !== reqNo),
      alertJobs: reqNo ? snapshot.alertJobs.filter(job => job.reqNo !== reqNo) : snapshot.alertJobs,
      hasActiveJob: hasActiveJob || snapshot.hasActiveJob,
    });
  }
  listeners.forEach(listener => listener());
}
