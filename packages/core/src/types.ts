export type FeedbackType = "bug" | "idea" | "praise" | "rating";

export interface FeedbackUser {
  id?: string;
  email?: string;
  name?: string;
}

export interface Feedback {
  /** What kind of feedback this is. */
  type: FeedbackType;
  /** Free-text message from the user. */
  message: string;
  /** Optional 1-5 rating, typically used with type "rating". */
  rating?: number;
  /** Page / screen the feedback was submitted from. Defaults to location.href. */
  url?: string;
  /** Arbitrary metadata attached to the feedback. */
  meta?: Record<string, unknown>;
}

export interface ReloopOptions {
  /** Publishable API key created in the dashboard (rl_pub_...). */
  apiKey: string;
  /**
   * Base URL of the Reloop server, e.g. https://feedback.example.com
   * The SDK appends the ingest path itself.
   */
  endpoint: string;
  /**
   * User to associate with submitted feedback. Optional; can also be set
   * (or changed, e.g. after login) later via client.identify().
   */
  user?: FeedbackUser;
}

export interface ReloopClient {
  /** Associate subsequent feedback with a user. */
  identify(user: FeedbackUser): void;
  /** Send a feedback item. Resolves on success, rejects on failure. */
  submit(feedback: Feedback): Promise<void>;
}

export interface IngestPayload {
  user?: FeedbackUser;
  item: Feedback;
}
