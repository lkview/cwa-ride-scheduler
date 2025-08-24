// Type-only shim so files that import `{ RideEvent }` from the RideForm module compile.
// This does NOT change runtime behavior. It just provides a named type export.
//
// It matches any import that ends with "components/RideForm".
declare module "*components/RideForm" {
  // A loose shape for a ride event row. Adjust if you later want stricter typing.
  export type RideEvent = {
    id: string;
    date?: string | null;
    time?: string | null;
    status?: string | null;
    pilot_id?: string | null;
    passenger1_id?: string | null;
    passenger2_id?: string | null;
    emergency_contact_id?: string | null;
    pickup_location_id?: string | null;
    notes?: string | null;
    [key: string]: any;
  };

  const RideForm: any; // keep existing default export working
  export default RideForm;
}
