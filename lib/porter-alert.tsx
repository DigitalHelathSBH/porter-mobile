"use client";

import {
  useEffect,
  useState,
} from "react";

import Swal from "sweetalert2";

import type { PorterJob } from "@/types/porter";

type AlertUrgencyInfo = {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  iconHtml: string;
};

export function getAlertUrgencyInfo(
  fastTrack: string,
): AlertUrgencyInfo {
  const value = String(fastTrack ?? "0").trim();

  switch (value) {
    case "2":
      return {
        label: "FastTrack",
        color: "#d93434",
        backgroundColor: "#fff5f5",
        borderColor: "#ef5a5a",
        iconHtml: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display: block; flex: 0 0 auto;">
            <path d="M13.5 2.5L5.5 13H11L10.5 21.5L18.5 10.5H13L13.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `,
      };

    case "1":
      return {
        label: "ด่วน",
        color: "#9a6800",
        backgroundColor: "#fff9e8",
        borderColor: "#e3b341",
        iconHtml: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display: block; flex: 0 0 auto;">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
            <path d="M12 7V12L15.5 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `,
      };

    case "0":
    default:
      return {
        label: "ปกติ",
        color: "#596674",
        backgroundColor: "#ffffff",
        borderColor: "#bcc7d2",
        iconHtml: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display: block; flex: 0 0 auto;">
            <path d="M7 3H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M7 21H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M8 3C8 7 9.5 9.5 12 12C9.5 14.5 8 17 8 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3C16 7 14.5 9.5 12 12C14.5 14.5 16 17 16 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `,
      };
  }
}

export function escapeHtml(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getTimeOnly(
  value: string | null | undefined,
): string {
  const text = String(value ?? "").trim();

  if (!text || text === "-") {
    return "-";
  }

  const matchedTime = text.match(/(\d{2}:\d{2})(?::\d{2})?$/);

  return matchedTime ? matchedTime[1] : text;
}

export function buildNewCaseAlertHtml(
  newJobs: PorterJob[],
): string {
  const displayedJobs = newJobs.slice(0, 3);

  const jobHtml = displayedJobs
    .map((job) => {
      const urgency = getAlertUrgencyInfo(job.fastTrack);
      const time = getTimeOnly(job.createdAtShort);
      const source = escapeHtml(job.locSource || "-");
      const destination = escapeHtml(job.locDest || "-");

      const centerLabel =
        String(job.porterType ?? "").trim().toUpperCase() === "ER"
          ? "ศูนย์เปล ER"
          : "ศูนย์เปล OPD";

      return `
        <div style="padding: 5px 0; text-align: left;">
          <div style="margin-bottom: 4px; color: #0d5ca6; font-size: 12px; font-weight: 700;">
            ${centerLabel}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 6px; margin-bottom: 6px; padding: 4px 9px; color: ${urgency.color}; background: ${urgency.backgroundColor}; border: 1px solid ${urgency.borderColor}; border-radius: 999px; font-size: 14px; font-weight: 700; line-height: 1.25; box-sizing: border-box;">
            ${urgency.iconHtml}
            <span>${urgency.label}&nbsp;•&nbsp;${escapeHtml(time)}</span>
          </div>
          <div style="color: #4b5563; font-size: 14px; font-weight: 400; line-height: 1.55; overflow-wrap: anywhere;">
            ${source}&nbsp;→&nbsp;${destination}
          </div>
        </div>
      `;
    })
    .join(`<div style="height: 1px; margin: 5px 0; background: #e5e7eb;"></div>`);

  const remainingCount = newJobs.length - displayedJobs.length;

  const remainingHtml =
    remainingCount > 0
      ? `<div style="margin-top: 8px; color: #718498; font-size: 12px; text-align: left;">และอีก ${remainingCount} เคส</div>`
      : "";

  return `
    <div style="width: 100%; box-sizing: border-box;">
      ${jobHtml}
      ${remainingHtml}
    </div>
  `;
}

/**
 * Hook สำหรับตรวจจับ "งานใหม่" จาก alertJobs
 * แล้วแสดง SweetAlert ทันทีที่เจอ
 *
 * excludeReqNo: ใช้ตอนอยู่หน้ารายละเอียดงาน
 * เพื่อไม่ให้งานที่กำลังดูอยู่ถูกนับเป็น "งานใหม่"
 */
type JobAlertHistory = { reqNos: Set<string> };

// Keep history across page mounts, including when sessionStorage is unavailable.
const jobAlertHistories = new Map<string, JobAlertHistory>();

function getJobAlertHistory(key: string): JobAlertHistory | undefined {
  const cached = jobAlertHistories.get(key);
  if (cached) return cached;

  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(key) ?? "null");
    if (Array.isArray(stored) && stored.every((value) => typeof value === "string")) {
      const history = { reqNos: new Set<string>(stored) };
      jobAlertHistories.set(key, history);
      return history;
    }
  } catch {
    // In-memory history still prevents duplicates during page navigation.
  }
  return undefined;
}

export function useNewJobAlert(
  alertJobs: PorterJob[],
  staffNo: string,
  excludeReqNo?: string,
  enabled = true,
): void {
  useEffect(() => {
    // The loader supplies staffNo only after its first successful response.
    // Do not use the initial empty loading state as the baseline.
    const staff = staffNo.trim().toUpperCase();
    if (!staff) return;

    const key = `porter-new-job-history:v1:${staff}`;
    const previousHistory = getJobAlertHistory(key);
    const history = previousHistory ?? { reqNos: new Set<string>() };
    const newJobs: PorterJob[] = [];

    for (const job of alertJobs) {
      const reqNo = job.reqNo.trim();
      if (!reqNo || history.reqNos.has(reqNo)) continue;
      // Mark every observed job before showing the toast. Never forget jobs
      // when they disappear from the queue or the dashboard is unmounted.
      history.reqNos.add(reqNo);
      if (enabled && previousHistory && reqNo !== excludeReqNo && job.isHeadJob !== true) {
        newJobs.push(job);
      }
    }

    jobAlertHistories.set(key, history);
    try {
      window.sessionStorage.setItem(key, JSON.stringify([...history.reqNos]));
    } catch {
      // Fall back to the shared in-memory history.
    }

    if (newJobs.length === 0) {
      return;
    }

    const alertTitle =
      newJobs.length === 1
        ? "มีเคสใหม่ค่ะ"
        : `มีเคสใหม่ ${newJobs.length} เคสค่ะ`;

    void Swal.fire({
      position: "top-end",
      toast: true,
      icon: "info",
      title: alertTitle,
      html: buildNewCaseAlertHtml(newJobs),
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      width: "390px",
    });
  }, [alertJobs, staffNo, excludeReqNo, enabled]);
}

/** Poll while viewing a waiting job; share the dashboard's notification history. */
export function useDetailNewJobAlert(staffNo: string, reqNo: string, enabled: boolean): void {
  const [snapshot, setSnapshot] = useState<{
    staffNo: string;
    jobs: PorterJob[];
    hasActiveJob: boolean;
  } | null>(null);

  useNewJobAlert(
    snapshot?.jobs ?? [],
    snapshot?.staffNo ?? "",
    reqNo,
    enabled && snapshot?.hasActiveJob === false,
  );

  useEffect(() => {
    if (!enabled || !staffNo.trim()) return;
    let disposed = false;
    let request: AbortController | null = null;

    async function check(): Promise<void> {
      if (disposed || request || document.visibilityState === "hidden" || !navigator.onLine) return;
      const controller = new AbortController();
      request = controller;
      const timeout = window.setTimeout(() => controller.abort(), 75_000);
      try {
        const response = await fetch("/api/porter/dashboard", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const result = await response.json() as {
          success?: boolean;
          staffNo?: string;
          alertJobs?: PorterJob[];
          currentAssignment?: { jobs?: PorterJob[] } | null;
        };
        if (disposed || !result.success || !Array.isArray(result.alertJobs)) return;
        if (result.staffNo?.trim().toUpperCase() !== staffNo.trim().toUpperCase()) return;
        setSnapshot({
          staffNo,
          jobs: result.alertJobs,
          hasActiveJob: (result.currentAssignment?.jobs?.length ?? 0) > 0,
        });
      } catch {
        // A failed poll must not replace the detail page or reset alert history.
      } finally {
        window.clearTimeout(timeout);
        request = null;
      }
    }

    const initial = window.setTimeout(() => { void check(); }, 0);
    const interval = window.setInterval(() => { void check(); }, 30_000);
    const refresh = () => { void check(); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      disposed = true;
      request?.abort();
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [enabled, staffNo]);
}
