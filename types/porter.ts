export type PorterJob = {
  reqNo: string;
  locSource: string;
  locDest: string;
  locAct: string;
  shift: string;
  bedType: string;

  fastTrack: string;
  fastTrackText: string;

  remark: string;
  equipment: string;
  detail: string;

  createdAt: string;
  createdAtShort: string;
  createdBy: string;

  status: string;
  currentProc: string;
  bedNo: string;

  cradleStaffNo: string | null;
  assignedAt: string | null;
  finishedAt: string | null;
};