// This file makes TypeScript happy for the import in
// app/ride-events/edit/[id]/page.tsx. It declares that the module
// "../../../../components/RideForm" has a default export (the component)
// and a named type export RideEvent. It has **no** runtime effect.
declare module "../../../../components/RideForm" {
  const RideForm: any;
  export default RideForm;
  export type RideEvent = any;
}
