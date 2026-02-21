"use client";

import HQNav from "@/components/hq/HQNav";

export default function HQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#171513] hq-dark">
      <HQNav />
      {children}
    </div>
  );
}
