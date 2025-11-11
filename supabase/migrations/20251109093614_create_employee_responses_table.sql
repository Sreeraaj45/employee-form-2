/*
  # Create employee responses table

  1. New Tables
    - `employee_responses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `employee_id` (text)
      - `email` (text)
      - `selected_skills` (text array)
      - `skill_ratings` (jsonb for storing skill rating objects)
      - `additional_skills` (text)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `employee_responses` table
    - Allow anonymous users to insert and read their responses

  3. Indexes
    - Index on timestamp for sorting
    - Index on email for lookups
*/

CREATE TABLE IF NOT EXISTS employee_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  employee_id text NOT NULL,
  email text NOT NULL,
  selected_skills text[] DEFAULT '{}',
  skill_ratings jsonb DEFAULT '[]'::jsonb,
  additional_skills text DEFAULT '',
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert responses"
  ON employee_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read responses"
  ON employee_responses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update responses"
  ON employee_responses
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete responses"
  ON employee_responses
  FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_employee_responses_timestamp ON employee_responses(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employee_responses_email ON employee_responses(email);
