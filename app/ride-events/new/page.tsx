// app/ride-events/new/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RideForm from "../../../components/RideForm";

export default function NewRidePage() {
  const router = useRouter();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">New Ride</h1>
      <RideForm onSaved={() => router.push("/")} onCancel={() => router.push("/")} />
    </div>
  );
}
