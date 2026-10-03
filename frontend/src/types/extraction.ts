export interface ExtractedRecord {
  company: string;
  product: string;
  category: string;
  severity: string;
  requested_action: string;
  refund_amount: number | null;
  deadline: string | null;
  escalated: boolean;
}

export interface JobResult {
  id: string;
  ticket_id: string;
  status: "completed" | "needs_review";
  record: ExtractedRecord | null;
  attempts: number;
  validation_errors: string[];
  human_edited: boolean;
}