export const COMPLAINT_STATUSES = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
  { value: "rejected",    label: "Rejected" },
] as const;

export const COMPLAINT_PRIORITIES = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "critical", label: "Critical" },
] as const;

export const COMPLAINT_CATEGORIES = [
  "Kemudahan Awam",
  "Keselamatan",
  "Kebersihan",
  "Infrastruktur",
  "Perkhidmatan",
  "Lain-lain",
] as const;

export type ComplaintStatus   = (typeof COMPLAINT_STATUSES)[number]["value"];
export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number]["value"];
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
