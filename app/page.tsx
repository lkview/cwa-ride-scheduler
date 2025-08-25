"use client";

import React from "react";
import Calendar3Week from "@/components/Calendar3Week";

/**
 * Minimal mock of the Rides page that renders the calendar at the top,
 * then defers to your existing list/table below if you want.
 * If you already have an app/page.tsx, just import Calendar3Week and place
 * <Calendar3Week /> above your table.
 */
export default function RidesPageWithCalendar() {
  return (
    <div className="space-y-6">
      <Calendar3Week />
      {/* Your existing rides table/list goes here */}
    </div>
  );
}
