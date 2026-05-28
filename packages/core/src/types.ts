export type ReloopItemType =
  | "bug"
  | "feedback"
  | "waitlist"
  | "question"
  | "other";

export interface BugItem {
  type: "bug";
  subject: string;
  message: string;
  /** Optional contact email — lets you reply or include the reporter in mailings. */
  email?: string;
  /** Optional base64-encoded screenshot (data URL). */
  screenshot?: string;
  meta?: Record<string, unknown>;
}

export interface FeedbackItem {
  type: "feedback";
  message: string;
  email?: string;
  meta?: Record<string, unknown>;
}

export interface WaitlistItem {
  type: "waitlist";
  email: string;
  meta?: Record<string, unknown>;
}

export interface QuestionItem {
  type: "question";
  subject: string;
  message: string;
  email?: string;
  screenshot?: string;
  meta?: Record<string, unknown>;
}

/** Escape hatch: everything optional, for anything that doesn't fit the others. */
export interface OtherItem {
  type: "other";
  subject?: string;
  message?: string;
  email?: string;
  screenshot?: string;
  meta?: Record<string, unknown>;
}

export type ReloopItem =
  | BugItem
  | FeedbackItem
  | WaitlistItem
  | QuestionItem
  | OtherItem;

export interface ReloopOptions {
  /** Publishable API key created in the dashboard (rl_pub_...). */
  apiKey: string;
  /**
   * Base URL of the Reloop server, e.g. https://reloop.example.com
   * The SDK appends the ingest path itself.
   */
  endpoint: string;
}

export interface ReloopClient {
  /** Send an item. Resolves on success, rejects on failure. */
  submit(item: ReloopItem): Promise<void>;
}
