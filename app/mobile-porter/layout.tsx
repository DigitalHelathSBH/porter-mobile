import type {
  ReactNode,
} from "react";

import PorterHeadJobMonitor
  from "@/components/porter-head-job-monitor";

type Props = {
  children: ReactNode;
};

export default function MobilePorterLayout({
  children,
}: Props) {
  return (
    <>
      <PorterHeadJobMonitor />

      {children}
    </>
  );
}