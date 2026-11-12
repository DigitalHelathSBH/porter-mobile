"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import PorterHeader from "@/components/porter-header";
import { ArrowLeftIcon, BedIcon, CalendarIcon, ClipboardIcon, ClockIcon, HospitalIcon, HourglassIcon, IvIcon, LightningIcon, NoteIcon, UserIcon, WheelchairIcon } from "@/components/porter-icons";
import type { PorterJob } from "@/types/porter";
import styles from "./porter-job-detail.module.css";

function DetailItem({ label, value, icon, full = false }: { label: string; value?: string | null; icon: ReactNode; full?: boolean }) {
  return <div className={`${styles.item} ${full ? styles.full : ""}`}>
    <span className={styles.icon}>{icon}</span>
    <div><dt>{label}</dt><dd>{value || "-"}</dd></div>
  </div>;
}

export default function PorterJobDetail({ job, staffNo, staffName, view }: {
  job: PorterJob | null;
  staffNo: string;
  staffName: string;
  view: string;
}) {
  const router = useRouter();
  const urgency = String(job?.fastTrack ?? "0").trim();
  const UrgencyIcon = urgency === "2" ? LightningIcon : urgency === "1" ? ClockIcon : HourglassIcon;

  return <main className={styles.page}>
    <div className={styles.container}>
      <PorterHeader staffNo={staffNo} staffName={staffName} subtitle="รายละเอียดงาน" compact />
      {job ? <>
        <section className={styles.card} aria-label="รหัสงานและความเร่งด่วน">
          <div className={styles.top}>
            <div><span className={styles.label}>รหัสงาน</span><h1 className={styles.request}>{job.reqNo}</h1></div>
            <span className={`${styles.urgency} ${urgency === "2" ? styles.fast : urgency === "1" ? styles.urgent : ""}`}>
              <UrgencyIcon size={13} />{job.fastTrackText || "ปกติ (ภายใน 25 นาที)"}
            </span>
          </div>
          {job.assignedAt && <div className={styles.date}><CalendarIcon size={13} />รับงานเมื่อ {job.assignedAt}</div>}
        </section>

        <section className={`${styles.card} ${styles.route}`} aria-label="ต้นทางและปลายทาง">
          <div className={styles.location}><span className={styles.dot} /><div><span className={styles.label}>ต้นทาง</span><div className={styles.value}><BedIcon size={18} /><span>{job.locSource || "-"}</span></div></div></div>
          <div className={styles.location}><span className={`${styles.dot} ${styles.destination}`} /><div><span className={styles.label}>ปลายทาง</span><div className={styles.value}><HospitalIcon size={18} /><span>{job.locDest || "-"}</span></div></div></div>
        </section>

        <section className={styles.card} aria-label="รายละเอียดงาน">
          <dl className={styles.grid}>
            <DetailItem label="กิจกรรม" value={job.locAct} icon={<ClipboardIcon size={20} />} />
            <DetailItem label="ประเภทที่ขอ" value={job.bedType} icon={<WheelchairIcon size={20} />} />
            <DetailItem label="เวร" value={job.shift} icon={<ClockIcon size={20} />} />
            <DetailItem label="เลขเตียง" value={job.bedNo} icon={<BedIcon size={20} />} />
            {job.hn && job.hn !== "-" && <DetailItem label="HN" value={job.hn} icon={<UserIcon size={20} />} full />}
            <DetailItem label="อุปกรณ์" value={job.equipment} icon={<IvIcon size={20} />} full />
            <DetailItem label="รายละเอียด" value={job.detail} icon={<NoteIcon size={20} />} full />
            <DetailItem label="หมายเหตุ" value={job.remark} icon={<ClipboardIcon size={20} />} full />
            <DetailItem label="ผู้แจ้ง" value={job.createdBy} icon={<UserIcon size={20} />} full />
            <DetailItem label="วันที่และเวลาที่แจ้งงาน" value={job.createdAt} icon={<CalendarIcon size={20} />} full />
            {job.finishedAt && <DetailItem label="วันที่และเวลาเสร็จสิ้น" value={job.finishedAt} icon={<CalendarIcon size={20} />} full />}
          </dl>
        </section>
      </> : <p className={styles.card} role="status">ไม่พบงานนี้ งานอาจมีผู้รับไปแล้ว หรือสถานะเปลี่ยนแปลง</p>}
      <div className={styles.footer}>
        <button type="button" className={styles.back} onClick={() => router.replace(`/mobile-porter?view=${encodeURIComponent(view)}`)}><ArrowLeftIcon size={19} />ย้อนกลับ</button>
      </div>
    </div>
  </main>;
}
