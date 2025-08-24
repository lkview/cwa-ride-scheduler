// Type shim so TS accepts `import RideForm, { RideEvent } from "../../../../components/RideForm"`
// No runtime impact. Safe to keep in repo.
//
// Why this file?
// Your page file imports a *named type* `RideEvent` from the RideForm component file,
// but that component only has a default export. This declaration file tells TypeScript
// that such a named type exists for that specific relative path.

declare module "../../../../components/RideForm" {
  import type { FC } from "react";
  // Default export: the RideForm component (typed loosely here)
  const RideForm: FC<any>;
  export default RideForm;

  // Named type export used only for typing in a page.
  // You can refine this later if you want stronger types.
  export type RideEvent = any;
}
