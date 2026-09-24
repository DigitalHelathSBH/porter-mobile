"use client";

import {
  useEffect,
  useRef,
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
export function useNewJobAlert(
  alertJobs: PorterJob[],
  excludeReqNo?: string,
): void {
  const knownJobReqNosRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const relevantJobs = excludeReqNo
      ? alertJobs.filter((job) => job.reqNo !== excludeReqNo)
      : alertJobs;

    const currentReqNos = new Set(relevantJobs.map((job) => job.reqNo));

    if (!hasInitializedRef.current) {
      knownJobReqNosRef.current = currentReqNos;
      hasInitializedRef.current = true;
      return;
    }

    const newJobs = relevantJobs.filter(
  (job) =>
    !knownJobReqNosRef.current.has(job.reqNo) &&
    job.isHeadJob !== true,   // ← เพิ่มบรรทัดนี้ ไม่แจ้งซ้ำสำหรับงานหัวหน้า
);

    knownJobReqNosRef.current = currentReqNos;

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
  }, [alertJobs, excludeReqNo]);
}