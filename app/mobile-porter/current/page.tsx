import { redirect } from "next/navigation";

// Active jobs are now managed on the dashboard alongside the waiting queue.
export default function CurrentJobPage() {
  redirect("/mobile-porter");
}
