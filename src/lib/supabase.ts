import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'Manager' | 'Director' | 'DRH' | 'DAF' | 'DGA' | 'DG';
  department_id: string | null;
  site_id: string | null;
  created_at: string;
};

export type RecruitmentRequest = {
  id: string;
  reference: string;
  requester_id: string;
  department_id: string;
  site_id: string;
  position_title: string;
  contract_type: string;
  reason_type: 'Creation' | 'Replacement' | 'Reinforcement';
  reason_comment: string;
  replaced_person_name?: string;
  replaced_person_function?: string;
  status: 'Open' | 'Closed' | 'Pending';
  current_validation_level: string;
  created_at: string;
  validated_at?: string;
  integration_date?: string;
};

export type Evaluation = {
  id: string;
  employee_id: string;
  manager_id: string;
  evaluation_reason: string;
  contract_end_date: string;
  current_situation: Record<string, unknown>;
  projected_situation: Record<string, unknown>;
  status: 'Draft' | 'InProgress' | 'Completed';
  current_validation_level: string;
  created_at: string;
  trigger_date: string;
  completed_at?: string;
};
