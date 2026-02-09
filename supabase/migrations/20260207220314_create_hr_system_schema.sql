/*
  # Kilani Groupe HR Management System - Complete Schema

  ## Overview
  This migration creates the complete database schema for the HR management system,
  including recruitment workflow and employee evaluation processes.

  ## 1. New Tables

  ### Core Tables
  - `profiles` - Extended user profiles with role management
    - `id` (uuid, FK to auth.users)
    - `email` (text)
    - `full_name` (text)
    - `role` (text) - Manager, Director, DRH, DAF, DGA, DG
    - `department_id` (uuid)
    - `created_at` (timestamptz)

  - `departments` - Organizational departments/directions
    - `id` (uuid, PK)
    - `name` (text)
    - `director_id` (uuid) - FK to profiles
    - `created_at` (timestamptz)

  - `sites` - Company sites/locations
    - `id` (uuid, PK)
    - `name` (text)
    - `address` (text)
    - `created_at` (timestamptz)

  ### Recruitment Workflow Tables
  - `recruitment_requests` - Job requisition requests
    - `id` (uuid, PK)
    - `reference` (text) - Auto-generated reference number
    - `requester_id` (uuid) - FK to profiles (Manager)
    - `department_id` (uuid) - FK to departments
    - `site_id` (uuid) - FK to sites
    - `position_title` (text)
    - `contract_type` (text)
    - `reason_type` (text) - Creation, Replacement, Reinforcement
    - `reason_comment` (text)
    - `replaced_person_name` (text) - For replacement
    - `replaced_person_function` (text)
    - `status` (text) - Open, Closed, Pending
    - `current_validation_level` (text)
    - `created_at` (timestamptz)
    - `validated_at` (timestamptz)
    - `integration_date` (timestamptz)

  - `validation_workflows` - Tracks validation steps
    - `id` (uuid, PK)
    - `request_id` (uuid) - FK to recruitment_requests or evaluations
    - `request_type` (text) - Recruitment or Evaluation
    - `validator_id` (uuid) - FK to profiles
    - `validator_role` (text) - Manager, Director, DRH, DAF, DGA, DG
    - `action` (text) - Pending, Approved, Rejected, Modified
    - `comment` (text)
    - `action_date` (timestamptz)
    - `reminder_sent` (boolean)
    - `created_at` (timestamptz)

  - `job_offers` - Published job offers
    - `id` (uuid, PK)
    - `recruitment_request_id` (uuid) - FK to recruitment_requests
    - `reference` (text)
    - `title` (text)
    - `description` (text)
    - `profile_required` (text)
    - `department_id` (uuid)
    - `site_id` (uuid)
    - `contract_type` (text)
    - `publication_date` (timestamptz)
    - `closing_date` (timestamptz)
    - `status` (text) - Draft, Published, Closed
    - `published_internal` (boolean)
    - `published_external` (boolean)
    - `created_at` (timestamptz)

  - `candidates` - Candidate database
    - `id` (uuid, PK)
    - `first_name` (text)
    - `last_name` (text)
    - `email` (text)
    - `phone` (text)
    - `cv_url` (text)
    - `skills` (text[])
    - `experience_years` (integer)
    - `created_at` (timestamptz)

  - `applications` - Candidate applications
    - `id` (uuid, PK)
    - `job_offer_id` (uuid) - FK to job_offers
    - `candidate_id` (uuid) - FK to candidates
    - `status` (text) - Received, Analyzing, PreSelected, Rejected, Interview, Validated, Confirmed, NotRetained
    - `ai_score` (numeric) - AI pre-selection score
    - `ai_analysis` (text) - AI analysis notes
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  - `interviews` - Interview scheduling and notes
    - `id` (uuid, PK)
    - `application_id` (uuid) - FK to applications
    - `interviewer_id` (uuid) - FK to profiles
    - `scheduled_date` (timestamptz)
    - `location` (text)
    - `notes` (text)
    - `conclusion` (text)
    - `status` (text) - Scheduled, Completed, Cancelled
    - `created_at` (timestamptz)

  - `application_comments` - Comments on applications
    - `id` (uuid, PK)
    - `application_id` (uuid) - FK to applications
    - `user_id` (uuid) - FK to profiles
    - `comment` (text)
    - `created_at` (timestamptz)

  ### Evaluation Workflow Tables
  - `evaluations` - Employee evaluations
    - `id` (uuid, PK)
    - `employee_id` (uuid) - FK to profiles
    - `manager_id` (uuid) - FK to profiles
    - `evaluation_reason` (text) - End of trial period, End of contract, etc.
    - `contract_end_date` (date)
    - `current_situation` (jsonb) - Current contract details
    - `projected_situation` (jsonb) - Proposed changes
    - `status` (text) - Draft, InProgress, Completed
    - `current_validation_level` (text)
    - `created_at` (timestamptz)
    - `trigger_date` (timestamptz)
    - `completed_at` (timestamptz)

  - `evaluation_comments` - Comments on evaluations
    - `id` (uuid, PK)
    - `evaluation_id` (uuid) - FK to evaluations
    - `user_id` (uuid) - FK to profiles
    - `comment` (text)
    - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Add appropriate policies for each role

  ## 3. Important Notes
  - All timestamps use timestamptz for proper timezone handling
  - Foreign keys ensure data integrity
  - Status fields use text enums for flexibility
  - JSONB used for flexible data structures (current/projected situations)
*/

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  director_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'Manager',
  department_id uuid REFERENCES departments(id),
  site_id uuid REFERENCES sites(id),
  created_at timestamptz DEFAULT now()
);

-- Add foreign key for department director
ALTER TABLE departments ADD CONSTRAINT fk_departments_director 
  FOREIGN KEY (director_id) REFERENCES profiles(id);

-- Create recruitment_requests table
CREATE TABLE IF NOT EXISTS recruitment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  requester_id uuid REFERENCES profiles(id) NOT NULL,
  department_id uuid REFERENCES departments(id) NOT NULL,
  site_id uuid REFERENCES sites(id) NOT NULL,
  position_title text NOT NULL,
  contract_type text NOT NULL,
  reason_type text NOT NULL,
  reason_comment text DEFAULT '',
  replaced_person_name text DEFAULT '',
  replaced_person_function text DEFAULT '',
  status text NOT NULL DEFAULT 'Open',
  current_validation_level text DEFAULT 'Manager',
  created_at timestamptz DEFAULT now(),
  validated_at timestamptz,
  integration_date timestamptz
);

-- Create validation_workflows table
CREATE TABLE IF NOT EXISTS validation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  request_type text NOT NULL,
  validator_id uuid REFERENCES profiles(id) NOT NULL,
  validator_role text NOT NULL,
  action text NOT NULL DEFAULT 'Pending',
  comment text DEFAULT '',
  action_date timestamptz,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create job_offers table
CREATE TABLE IF NOT EXISTS job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_request_id uuid REFERENCES recruitment_requests(id),
  reference text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  profile_required text NOT NULL,
  department_id uuid REFERENCES departments(id) NOT NULL,
  site_id uuid REFERENCES sites(id) NOT NULL,
  contract_type text NOT NULL,
  publication_date timestamptz,
  closing_date timestamptz,
  status text NOT NULL DEFAULT 'Draft',
  published_internal boolean DEFAULT false,
  published_external boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  cv_url text DEFAULT '',
  skills text[] DEFAULT ARRAY[]::text[],
  experience_years integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_offer_id uuid REFERENCES job_offers(id) NOT NULL,
  candidate_id uuid REFERENCES candidates(id) NOT NULL,
  status text NOT NULL DEFAULT 'Received',
  ai_score numeric DEFAULT 0,
  ai_analysis text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) NOT NULL,
  interviewer_id uuid REFERENCES profiles(id) NOT NULL,
  scheduled_date timestamptz,
  location text DEFAULT '',
  notes text DEFAULT '',
  conclusion text DEFAULT '',
  status text NOT NULL DEFAULT 'Scheduled',
  created_at timestamptz DEFAULT now()
);

-- Create application_comments table
CREATE TABLE IF NOT EXISTS application_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) NOT NULL,
  manager_id uuid REFERENCES profiles(id) NOT NULL,
  evaluation_reason text NOT NULL,
  contract_end_date date NOT NULL,
  current_situation jsonb DEFAULT '{}'::jsonb,
  projected_situation jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Draft',
  current_validation_level text DEFAULT 'Manager',
  created_at timestamptz DEFAULT now(),
  trigger_date timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create evaluation_comments table
CREATE TABLE IF NOT EXISTS evaluation_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES evaluations(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for sites
CREATE POLICY "Authenticated users can view sites"
  ON sites FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for departments
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for recruitment_requests
CREATE POLICY "Users can view recruitment requests in their workflow"
  ON recruitment_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
    )
  );

CREATE POLICY "Managers can create recruitment requests"
  ON recruitment_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests in their workflow"
  ON recruitment_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = requester_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
    )
  )
  WITH CHECK (
    auth.uid() = requester_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
    )
  );

-- RLS Policies for validation_workflows
CREATE POLICY "Users can view validations they're involved in"
  ON validation_workflows FOR SELECT
  TO authenticated
  USING (
    auth.uid() = validator_id OR
    EXISTS (
      SELECT 1 FROM recruitment_requests
      WHERE recruitment_requests.id = request_id
      AND recruitment_requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "System can create validation workflows"
  ON validation_workflows FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Validators can update their validations"
  ON validation_workflows FOR UPDATE
  TO authenticated
  USING (auth.uid() = validator_id)
  WITH CHECK (auth.uid() = validator_id);

-- RLS Policies for job_offers
CREATE POLICY "HR and managers can view job offers"
  ON job_offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Manager', 'Director', 'DAF', 'DGA', 'DG')
    )
  );

CREATE POLICY "HR can manage job offers"
  ON job_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  );

-- RLS Policies for candidates
CREATE POLICY "HR can view all candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Manager', 'Director')
    )
  );

CREATE POLICY "HR can manage candidates"
  ON candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  );

-- RLS Policies for applications
CREATE POLICY "HR and managers can view applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Manager', 'Director')
    )
  );

CREATE POLICY "HR can manage applications"
  ON applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Manager', 'Director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Manager', 'Director')
    )
  );

-- RLS Policies for interviews
CREATE POLICY "Interviewers can view their interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  );

CREATE POLICY "HR and interviewers can manage interviews"
  ON interviews FOR ALL
  TO authenticated
  USING (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  )
  WITH CHECK (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'DRH'
    )
  );

-- RLS Policies for application_comments
CREATE POLICY "Users can view comments on applications they access"
  ON application_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Manager', 'Director')
    )
  );

CREATE POLICY "Users can add comments"
  ON application_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for evaluations
CREATE POLICY "Users can view evaluations they're involved in"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = employee_id OR
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
    )
  );

CREATE POLICY "Managers can create evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'Director')
    )
  );

CREATE POLICY "Users can update evaluations in their workflow"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
    )
  )
  WITH CHECK (
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
    )
  );

-- RLS Policies for evaluation_comments
CREATE POLICY "Users can view evaluation comments they're involved in"
  ON evaluation_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evaluations
      WHERE evaluations.id = evaluation_id
      AND (
        evaluations.employee_id = auth.uid() OR
        evaluations.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('DRH', 'DAF', 'DGA', 'DG', 'Director')
        )
      )
    )
  );

CREATE POLICY "Users can add evaluation comments"
  ON evaluation_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_requests_status ON recruitment_requests(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_requests_requester ON recruitment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_validation_workflows_request ON validation_workflows(request_id);
CREATE INDEX IF NOT EXISTS idx_validation_workflows_validator ON validation_workflows(validator_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_offer ON applications(job_offer_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);