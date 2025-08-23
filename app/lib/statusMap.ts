export function toDbStatus(ui: string): "Draft" | "Tentative" | "Confirmed" | "Completed" | "Canceled" {
  switch ((ui || "").toLowerCase()) {
    case "scheduled": return "Tentative";
    case "cancelled": return "Canceled";
    case "confirmed": return "Confirmed";
    case "completed": return "Completed";
    default: return "Draft";
  }
}
