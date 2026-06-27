import type { Question } from "@/types";

/** Content lifecycle states (draft → review → published, plus retired). */
export type ContentStatus = "draft" | "in_review" | "published" | "retired";

/** An authored item: a Question plus authoring metadata. */
export interface ContentItem extends Question {
  status: ContentStatus;
  version: number;
  objectiveIds: string[];
  updatedAt: string;
  authorName?: string;
}

export interface QaIssue {
  level: "error" | "warning";
  field?: string;
  message: string;
}

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  retired: "Retired",
};
