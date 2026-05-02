export interface Notification {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
}

export type NotificationType = "Placement" | "Result" | "Event";

export interface ScoredNotification extends Notification {
  priorityScore: number;
  typeScore: number;
  recencyScore: number;
}
