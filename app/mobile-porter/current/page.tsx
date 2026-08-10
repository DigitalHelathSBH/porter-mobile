import PorterCurrentJob
  from "@/components/porter-current-job";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    userid?: string;
  }>;
};

export default async function CurrentJobPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const staffNo = String(
    params.userid ?? "",
  ).trim();

  return (
    <PorterCurrentJob
      staffNo={staffNo}
    />
  );
}