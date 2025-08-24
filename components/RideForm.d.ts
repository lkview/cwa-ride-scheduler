import type { FC } from "react";

/** Minimal shape used by Edit/New pages for typing only. */
export type RideEvent = {
  id?: string;
  date?: string;
  time?: string;
  status?: string;
  pilot_id?: string | null;
  passenger1_id?: string | null;
  passenger2_id?: string | null;
  emergency_contact_id?: string | null;
  pickup_location_id?: string | null;
  notes?: string | null;
};

/** This file only adds types; runtime comes from RideForm.tsx */
declare const RideForm: FC<any>;
export default RideForm;
