import { redirect } from "next/navigation";

// Old bookmarks now lead to the list, where job details and acceptance live.
export default async function LegacyJobDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const validView = view === "ศูนย์เปล OPD" || view === "ศูนย์เปล ER" || view === "finished" ? view : "ศูนย์เปล IPD";
  redirect(`/mobile-porter?view=${encodeURIComponent(validView)}`);
}
