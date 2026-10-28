import { Shared } from "@/components/result";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <Shared token={token} />;
}
