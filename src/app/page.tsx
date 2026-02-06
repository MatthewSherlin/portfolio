"use client";

import dynamic from "next/dynamic";

const CRTMonitorScene = dynamic(
  () =>
    import("@/components/crt/CRTMonitorScene").then(
      (m) => m.CRTMonitorScene
    ),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <CRTMonitorScene />
    </main>
  );
}
