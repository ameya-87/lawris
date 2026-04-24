export type CaseType = "civil" | "criminal" | "family" | "labour" | "consumer";
export type CasePhase =
  | "intake"
  | "pretrial"
  | "pleadings"
  | "charges"
  | "evidence"
  | "arguments"
  | "judgment";
export type CaseStatus = "active" | "stayed" | "disposed" | "appealed";
export type CourtType =
  | "district"
  | "sessions"
  | "high_court"
  | "supreme_court"
  | "tribunal"
  | "magistrate";
export type DeadlineType = "hearing" | "statutory" | "filing" | "compliance" | "limitation";
export type Urgency = "critical" | "high" | "medium" | "low";
export type DocType =
  | "fir"
  | "bail_app"
  | "plaint"
  | "written_statement"
  | "chargesheet"
  | "affidavit"
  | "vakalatnama"
  | "legal_notice"
  | "judgment"
  | "other";
export type DocSource = "uploaded" | "ai_drafted" | "ai_assisted";
export type ResearchSource = "ai_chat" | "indiankanoon" | "manual";

export interface Client {
  id: string;
  lawyer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  aadhar_no: string | null;
  created_at: string;
}

export interface Case {
  id: string;
  lawyer_id: string;
  client_id: string | null;
  case_number: string | null;
  title: string;
  case_type: CaseType;
  phase: CasePhase;
  status: CaseStatus;
  court_name: string | null;
  court_type: CourtType | null;
  fir_date: string | null;
  fir_number: string | null;
  police_station: string | null;
  sections: string | null;
  offence_max_years: number | null;
  arrest_date: string | null;
  opposing_party: string | null;
  notes: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface Deadline {
  id: string;
  case_id: string;
  title: string;
  deadline_type: DeadlineType;
  due_date: string;
  urgency: Urgency | null;
  is_auto_generated: boolean;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  name: string;
  doc_type: DocType;
  phase: CasePhase | null;
  source: DocSource;
  file_url: string | null;
  content: string | null;
  ai_prompt_used: string | null;
  uploaded_at: string;
}

export interface HearingLog {
  id: string;
  case_id: string;
  hearing_date: string;
  what_happened: string;
  judge_order: string | null;
  next_date: string | null;
  next_action: string | null;
  created_at: string;
}

export interface ResearchNote {
  id: string;
  case_id: string | null;
  query: string;
  source: ResearchSource | null;
  content: string;
  citation: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  bar_council_no: string | null;
  phone: string | null;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  case_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  created_at: string;
}

export interface ChunkMatch {
  content: string;
  chunk_index: number;
  document_id: string;
  similarity: number;
}
