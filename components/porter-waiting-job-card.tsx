"use client";

import Link from "next/link";
import type { PorterJob } from "@/types/porter";
import { BedIcon, CheckIcon, ClipboardIcon, ClockIcon, HourglassIcon, IvIcon, LightningIcon, NoteIcon, WheelchairIcon } from "@/components/porter-icons";
import { getTimeOnly } from "@/lib/porter-alert";
import styles from "./porter-waiting-job-card.module.css";

type Props = {
  job: PorterJob;
  index: number;
  busy: boolean;
  disabled: boolean;
  error?: string;
  onAccept: () => void;
  hideAccept?: boolean;
  active?: boolean;
  onCancel?: () => void;
  onFinish?: () => void;
  detailHref?: string;
  readOnly?: boolean;
};

export default function PorterWaitingJobCard({ job, index, busy, disabled, error, onAccept, hideAccept = false, active = false, onCancel, onFinish, detailHref, readOnly = false }: Props) {
  const urgency = String(job.fastTrack ?? "0").trim();
  const urgencyLabel = urgency === "2" ? "FastTrack" : urgency === "1" ? "ด่วน" : "ปกติ";
  const urgencyClass = urgency === "2" ? styles.fast : urgency === "1" ? styles.urgent : styles.normal;
  const UrgencyIcon = urgency === "2" ? LightningIcon : urgency === "1" ? ClockIcon : HourglassIcon;
  const TransportIcon = job.bedType.includes("นอน") ? BedIcon : WheelchairIcon;
  const vehicle = job.bedType.replace(/\s/g, "");
  const vehicleClass = vehicle.includes("เฉพาะเจ้าหน้าที่") ? styles.staffVehicle
    : vehicle.includes("นั่ง") && vehicle.includes("น้ำเกลือ") ? styles.ivVehicle
    : vehicle.includes("นอน") ? styles.bedVehicle : styles.chairVehicle;
  const hn = String(job.hn ?? "").trim();
  const notes = [job.detail, job.remark]
    .map(value => String(value ?? "").trim())
    .filter(value => value && value !== "-")
    .join("/");

  return (
    <article className={`${styles.card} ${active ? styles.activeCard : ""}`} aria-labelledby={`job-${job.reqNo}`} aria-busy={busy}>
      {detailHref && <Link href={detailHref} className={styles.cardLink} aria-label={`ดูรายละเอียดงาน ${job.reqNo}`} />}
      <header className={styles.header}>
        <span className={styles.number}>{index + 1}</span>
        <div className={styles.identity}>
          <span className={styles.caption}>รหัสงาน</span>
          <h2 id={`job-${job.reqNo}`}>{job.reqNo}</h2>
        </div>
        <div className={styles.statusColumn}>
        <span className={`${styles.time} ${urgencyClass}`} title={job.fastTrackText}>
          <UrgencyIcon size={13} />
          {getTimeOnly(job.createdAtShort)}
        </span>
        {active && job.isHeadJob && <span className={styles.headJob}>งานจากหัวหน้าเวรค่ะ</span>}
        {active && <span className={styles.inProgress}>กำลังดำเนินการ</span>}
        </div>
      </header>

      <div className={styles.badges}>
        <span className={`${styles.urgency} ${urgencyClass}`}>{urgencyLabel}</span>
        <span className={`${styles.transport} ${vehicleClass}`}><TransportIcon size={16} />{job.bedType || "ไม่ระบุประเภทรถ"}</span>
        {hn && hn !== "-" && <span className={styles.transport}>HN {hn}</span>}
      </div>

      <div className={styles.route}>
        <div className={styles.location}><span className={styles.sourceDot} /><div><span className={styles.caption}>ต้นทาง</span><strong>{job.locSource || "-"}</strong></div></div>
        <span className={styles.routeArrow} aria-hidden="true">→</span>
        <div className={styles.location}><span className={styles.destinationDot} /><div><span className={styles.caption}>ปลายทาง</span><strong>{job.locDest || "-"}</strong></div></div>
      </div>

      <dl className={styles.details}>
        <div><dt><ClipboardIcon size={16} />กิจกรรม</dt><dd>{job.locAct || "-"}</dd></div>
        <div><dt><IvIcon size={16} />อุปกรณ์</dt><dd>{job.equipment || "-"}</dd></div>
        <div><dt><BedIcon size={16} />เลขเตียง</dt><dd>{job.bedNo || "-"}</dd></div>
      </dl>
      {notes && <div className={styles.notes}>
        <div className={styles.notesTitle}><NoteIcon size={16} />รายละเอียด / หมายเหตุ</div>
        <p>{notes}</p>
      </div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!readOnly && (active ? <div className={styles.actions}>
        {!job.isHeadJob && <button type="button" className={styles.cancel} onClick={onCancel} disabled={disabled}>ยกเลิกงาน</button>}
        <button type="button" className={styles.accept} onClick={onFinish} disabled={disabled}>
          <CheckIcon size={19} />{busy ? "กำลังบันทึก..." : "เสร็จสิ้นงาน"}
        </button>
      </div> : !hideAccept && <button type="button" className={styles.accept} onClick={onAccept} disabled={disabled}>
        <CheckIcon size={19} />{busy ? "กำลังรับงาน..." : "รับงาน / เริ่ม"}
      </button>)}
    </article>
  );
}
