import { Result } from "@/components/result";
import { demo } from "@/lib/demo";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Result id={id} example={id === "demo" ? demo : undefined} />;
}
