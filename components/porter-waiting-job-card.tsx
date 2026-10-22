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
};

export default function PorterWaitingJobCard({ job, index, busy, disabled, error, onAccept }: Props) {
  const urgency = String(job.fastTrack ?? "0").trim();
  const urgencyLabel = urgency === "2" ? "FastTrack" : urgency === "1" ? "ด่วน" : "ปกติ";
  const urgencyClass = urgency === "2" ? styles.fast : urgency === "1" ? styles.urgent : styles.normal;
  const UrgencyIcon = urgency === "2" ? LightningIcon : urgency === "1" ? ClockIcon : HourglassIcon;
  const TransportIcon = job.bedType.includes("นอน") ? BedIcon : WheelchairIcon;
  const hn = String(job.hn ?? "").trim();
  const notes = [job.detail, job.remark]
    .map(value => String(value ?? "").trim())
    .filter(value => value && value !== "-")
    .join("/");

  return (
    <article className={styles.card} aria-labelledby={`job-${job.reqNo}`} aria-busy={busy}>
      <header className={styles.header}>
        <span className={styles.number}>{index + 1}</span>
        <div className={styles.identity}>
          <span className={styles.caption}>รหัสงาน</span>
          <h2 id={`job-${job.reqNo}`}>{job.reqNo}</h2>
        </div>
        <span className={`${styles.time} ${urgencyClass}`} title={job.fastTrackText}>
          <UrgencyIcon size={13} />
          {getTimeOnly(job.createdAtShort)}
        </span>
      </header>

      <div className={styles.badges}>
        <span className={`${styles.urgency} ${urgencyClass}`}>{urgencyLabel}</span>
        <span className={styles.transport}><TransportIcon size={16} />{job.bedType || "ไม่ระบุประเภทรถ"}</span>
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
      <button type="button" className={styles.accept} onClick={onAccept} disabled={disabled}>
        <CheckIcon size={19} />{busy ? "กำลังรับงาน..." : "รับงาน / เริ่ม"}
      </button>
    </article>
  );
}
