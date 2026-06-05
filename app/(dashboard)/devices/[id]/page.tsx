import { DeviceDetail } from "@/components/devices/device-detail";

export const metadata = { title: "Device · IoTFlow" };

export default async function DevicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeviceDetail id={id} />;
}
