/**
 * E-VOTING SMPN 1 SUKAMULIA 2026/2027
 * TypeScript Type Definitions
 */

export interface School {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  principal_name: string;
  committee_chair: string;
  committee_secretary: string;
}

export type ElectionStatus = 'draft' | 'active' | 'paused' | 'closed';

export interface Election {
  id: string;
  school_id: string;
  title: string;
  academic_year: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: ElectionStatus;
  is_published: boolean;
}

export interface ClassItem {
  id: string;
  election_id: string;
  name: string;
  grade_level: '7' | '8' | '9';
  description?: string;
  is_active: boolean;
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  election_id: string;
  class_id: string;
  class_name?: string;
  nisn: string;
  full_name: string;
  birth_date?: string;
  gender?: 'L' | 'P';
  is_active: boolean;
  has_voted?: boolean;
  voted_at?: string;
  token?: string;
  token_preview?: string;
  is_token_revoked?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  ballot_number: number;
  photo_url: string;
  leader_name: string;
  vice_leader_name: string;
  leader_class?: string;
  vice_leader_class?: string;
  vision: string;
  mission: string;
  slogan: string;
  program_desc?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateResult extends Candidate {
  vote_count: number;
  percentage: number;
}

export interface VoterParticipation {
  id: string;
  election_id: string;
  student_id: string;
  voted_at: string;
  ip_hash?: string;
}

export interface Ballot {
  id: string;
  election_id: string;
  candidate_id: string;
  created_at: string;
}

export interface ElectionDocument {
  id: string;
  election_id: string;
  doc_type: string;
  title: string;
  doc_number: string;
  execution_date: string;
  execution_time: string;
  execution_place: string;
  total_eligible: number;
  total_voted: number;
  total_unvoted: number;
  total_valid_votes: number;
  total_invalid_votes: number;
  results_summary?: Array<{
    ballot_number: number;
    leader_name: string;
    vice_leader_name: string;
    vote_count: number;
    percentage: number;
  }>;
  notes?: string;
  is_verified: boolean;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  election_id?: string;
  action: string;
  actor: string;
  details: string;
  created_at: string;
}

export interface AuthSession {
  role: 'admin' | 'student';
  student?: Student;
  adminEmail?: string;
  token?: string;
  expiresAt: number;
}
