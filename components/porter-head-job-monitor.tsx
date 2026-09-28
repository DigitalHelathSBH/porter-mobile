"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import Swal from "sweetalert2";

type DashboardJob = {
  reqNo: string;
  status?: string | null;
  currentProc?: string | null;
  cradleStaffNo?: string | null;
  assignedAt?: string | null;
  isHeadJob?: boolean;
};

type CurrentAssignment = {
  staffNo?: string;
  staffName?: string;
  assignedAt?: string;
  jobs?: DashboardJob[] | null;
};

type AutoHeadResponse = {
  success?: boolean;
  activated?: boolean;
  assignment?: CurrentAssignment | null;
  pendingJob?: DashboardJob | null;
  currentAssignment?: CurrentAssignment | null;
};

function showHeadJobToast(
  reqNo: string,
): void {
  void Swal.fire({
    position: "top-end",
    toast: true,
    icon: "warning",
    title: "งานจากหัวหน้าค่ะ",
    html: `
      <div
        style="
          text-align: left;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.55;
        "
      >
        รหัสงาน <strong>${reqNo}</strong>
      </div>
    `,
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    width: "350px",
    background: "#fff8ec",
    iconColor: "#e0972e",
  });
}

export default function PorterHeadJobMonitor() {
  const router = useRouter();
  const pathname = usePathname();

  const checkingRef = useRef(false);
  const disposedRef = useRef(false);

  /*
   * เก็บ reqNo ของงานหัวหน้าที่เคยแจ้งเตือนไปแล้ว
   * เปลี่ยนจาก string เดี่ยว -> Set
   * เพื่อรองรับงานหัวหน้าหลายงานพร้อมกัน
   */
  const notifiedHeadReqNosRef =
    useRef<Set<string>>(new Set());

  const seenCurrentReqNosRef =
    useRef<Set<string>>(new Set());

  function notifyNewHeadJobs(
    reqNos: string[],
  ): void {
    for (const reqNo of reqNos) {
      if (!reqNo) {
        continue;
      }

      if (
        !notifiedHeadReqNosRef.current.has(
          reqNo,
        )
      ) {
        notifiedHeadReqNosRef.current.add(
          reqNo,
        );

        showHeadJobToast(reqNo);
      }
    }
  }

  const checkHeadJob =
    useCallback(async (): Promise<void> => {
      if (disposedRef.current) {
        return;
      }

      if (checkingRef.current) {
        return;
      }

      checkingRef.current = true;

      try {
        const response = await fetch(
          "/api/porter/assignment/auto-head",
          {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            body: JSON.stringify({
              activate: false,
            }),
          },
        );

        if (response.status === 401) {
          window.location.href =
            "/mobile-porter/login";
          return;
        }

        if (!response.ok) {
          return;
        }

        const result =
          (await response.json()) as AutoHeadResponse;

        console.log("=== auto-head result ===", result);   // ← เพิ่มบรรทัดนี้

        if (!result.success) {
          return;
        }

        const pendingJob = result.pendingJob ?? null;
        const currentAssignment =
          result.currentAssignment ?? null;

        /*
         * งานทั้งหมดที่ Active อยู่แล้ว
         * ไม่ว่าจะเป็นงานหัวหน้าเวรหรือไม่ก็ตาม
         * ขอแค่เป็นงานที่ถูกมอบหมายมาโดยเราไม่ได้กดรับเอง
         */
        const currentJobs =
          currentAssignment?.jobs ?? [];

        const newJobs = currentJobs.filter(
          (job) =>
            !seenCurrentReqNosRef.current.has(
              String(job.reqNo ?? "").trim(),
            ),
        );

        currentJobs.forEach((job) => {
          seenCurrentReqNosRef.current.add(
            String(job.reqNo ?? "").trim(),
          );
        });

        /* toast สีส้มเฉพาะงานหัวหน้าจริง */
        notifyNewHeadJobs(
          newJobs
            .filter((job) => job.isHeadJob === true)
            .map((job) => String(job.reqNo ?? "").trim()),
        );

        /* มีงานใหม่เข้ามา -> เด้งไปหน้า current */
          if (newJobs.length > 0) {
            if (pathname !== "/mobile-porter/current") {
              router.replace("/mobile-porter/current");
            } else {
              router.refresh();
            }

            /* จำงานหลังสั่ง redirect แล้วเท่านั้น */
            newJobs.forEach((job) => {
              seenCurrentReqNosRef.current.add(
                String(job.reqNo ?? "").trim(),
              );
            });

            return;
          }

        /*
         * ไม่มีงานหัวหน้ารอ
         */
        if (!pendingJob) {
          return;
        }

        const headReqNo = String(
          pendingJob.reqNo ?? "",
        ).trim();

        if (!headReqNo) {
          return;
        }

        notifyNewHeadJobs([headReqNo]);

         /*
         * มีงานปัจจุบันอื่นอยู่แล้ว (ไม่ใช่งานหัวหน้า)
         * ห้ามแย่งหน้า แค่แจ้งเตือนพอ
         */
        const hasOtherCurrentJob =
          (currentAssignment?.jobs ?? []).length > 0;

        if (hasOtherCurrentJob) {
          return;
        }

        if (pendingJob.status === "กำลังดำเนินการ") {
          if (pathname !== "/mobile-porter/current") {
            router.replace("/mobile-porter/current");
          } else {
            router.refresh();
          }

          return;
        }

        if (
          pendingJob.status === "ยังไม่ดำเนินการ" ||
          !pendingJob.status
        ) {
          const activateResponse = await fetch(
            "/api/porter/assignment/auto-head",
            {
              method: "POST",
              cache: "no-store",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
              body: JSON.stringify({
                activate: true,
              }),
            },
          );

          if (activateResponse.status === 401) {
            window.location.href =
              "/mobile-porter/login";
            return;
          }

          if (!activateResponse.ok) {
            return;
          }

          const activated =
            (await activateResponse.json()) as AutoHeadResponse;

          if (!activated.success) {
            return;
          }

                    const activatedJobs =
            activated.assignment?.jobs ?? [];

          if (activatedJobs.length > 0) {
            notifyNewHeadJobs(
              activatedJobs.map((job) =>
                String(job.reqNo ?? "").trim(),
              ),
            );
          }

          if (activated.assignment) {
            if (pathname !== "/mobile-porter/current") {
              router.replace("/mobile-porter/current");
            } else {
              router.refresh();
            }
          }
        }
      } catch (error) {
        console.error(
          "PorterHeadJobMonitor error:",
          error,
        );
      } finally {
        checkingRef.current = false;
      }
    }, [pathname, router]);

  useEffect(() => {
    disposedRef.current = false;

    if (pathname === "/mobile-porter/login") {
      return () => {
        disposedRef.current = true;
      };
    }

    void checkHeadJob();

    const timer = window.setInterval(() => {
      void checkHeadJob();
    }, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkHeadJob();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      disposedRef.current = true;
      window.clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [pathname, checkHeadJob]);

  return null;
}