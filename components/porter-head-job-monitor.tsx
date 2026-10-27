"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
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

function showHeadJobToast(reqNo: string): void {
  void Swal.fire({
    position: "top-end",
    toast: true,
    icon: "warning",
    title: "งานจากหัวหน้าค่ะ",
    text: `รหัสงาน ${reqNo}`,
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
  const requestRef = useRef<AbortController | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const seenCurrentReqNosRef =
    useRef<Set<string>>(new Set());
  const notifiedHeadReqNosRef = useRef<Set<string>>(new Set());

  function notifyNewHeadJobs(reqNos: string[]): void {
    for (const reqNo of reqNos) {
      if (!reqNo || notifiedHeadReqNosRef.current.has(reqNo)) continue;
      notifiedHeadReqNosRef.current.add(reqNo);
      showHeadJobToast(reqNo);
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

      if (!navigator.onLine) {
        setConnectionMessage("ขาดการเชื่อมต่อ กำลังรอเครือข่ายเพื่อตรวจงานหัวหน้าอีกครั้ง");
        return;
      }

      if (document.visibilityState === "hidden") {
        return;
      }

      checkingRef.current = true;
      const controller = new AbortController();
      requestRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 75_000);

      try {
        const response = await fetch(
          "/api/porter/assignment/auto-head",
          {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
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

        if (disposedRef.current || controller.signal.aborted) return;

        if (response.status === 401) {
          router.replace("/mobile-porter/login");
          return;
        }

        if (!response.ok) {
          setConnectionMessage(`ตรวจงานหัวหน้าไม่สำเร็จ (HTTP ${response.status}) ระบบจะลองใหม่อัตโนมัติ`);
          return;
        }

        const result =
          (await response.json()) as AutoHeadResponse;

        if (disposedRef.current || controller.signal.aborted) return;
        setConnectionMessage(result.success ? null : "ตรวจงานหัวหน้าไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ");

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

        notifyNewHeadJobs(
          newJobs.filter(job => job.isHeadJob === true)
            .map(job => String(job.reqNo ?? "").trim()),
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
              signal: controller.signal,
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

          if (disposedRef.current || controller.signal.aborted) return;

          if (activateResponse.status === 401) {
            router.replace("/mobile-porter/login");
            return;
          }

          if (!activateResponse.ok) {
            setConnectionMessage(`รับงานหัวหน้าไม่สำเร็จ (HTTP ${activateResponse.status}) ระบบจะตรวจสถานะใหม่อัตโนมัติ`);
            return;
          }

          const activated =
            (await activateResponse.json()) as AutoHeadResponse;

          if (disposedRef.current || controller.signal.aborted) return;

          if (!activated.success) {
            return;
          }

          notifyNewHeadJobs(
            (activated.assignment?.jobs ?? []).map(job => String(job.reqNo ?? "").trim()),
          );

          if (activated.assignment) {
            if (pathname !== "/mobile-porter/current") {
              router.replace("/mobile-porter/current");
            } else {
              router.refresh();
            }
          }
        }
      } catch (error) {
        if (disposedRef.current || requestRef.current !== controller) return;
        if (controller.signal.aborted || error instanceof TypeError) {
          setConnectionMessage("ติดต่อระบบตรวจงานหัวหน้าไม่ได้ ระบบจะลองใหม่เมื่อเชื่อมต่อได้");
          return;
        }
        setConnectionMessage("ตรวจงานหัวหน้าไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ");
        console.error(
          "PorterHeadJobMonitor error:",
          error,
        );
      } finally {
        window.clearTimeout(timeout);
        if (requestRef.current === controller) {
          requestRef.current = null;
          checkingRef.current = false;
        }
      }
    }, [pathname, router]);

  useEffect(() => {
    disposedRef.current = false;

    if (pathname === "/mobile-porter/login") {
      return () => {
        disposedRef.current = true;
      };
    }

    const initialCheck = window.setTimeout(() => {
      void checkHeadJob();
    }, 0);

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
    window.addEventListener("online", checkHeadJob);
    const handleOffline = () => {
      setConnectionMessage("ขาดการเชื่อมต่อ กำลังรอเครือข่ายเพื่อตรวจงานหัวหน้าอีกครั้ง");
    };
    window.addEventListener("offline", handleOffline);

    return () => {
      disposedRef.current = true;
      requestRef.current?.abort();
      requestRef.current = null;
      checkingRef.current = false;
      window.clearTimeout(initialCheck);
      window.clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      window.removeEventListener("online", checkHeadJob);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pathname, checkHeadJob]);

  if (!connectionMessage || pathname === "/mobile-porter/login") return null;

  return (
    <div role="status" style={{ padding: "10px 14px", background: "#fff7de", color: "#785400", fontSize: "13px", lineHeight: 1.6 }}>
      {connectionMessage}
    </div>
  );
}
