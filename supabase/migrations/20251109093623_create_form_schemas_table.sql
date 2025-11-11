/*
  # Create form schemas table

  1. New Tables
    - `form_schemas`
      - `id` (uuid, primary key)
      - `schema` (jsonb for storing form field definitions)
      - `version` (integer for tracking schema versions)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `form_schemas` table
    - Allow anonymous users to read and update the shared schema

  3. Notes
    - Single shared schema for all users (only one record)
    - Using version number to track changes
*/

CREATE TABLE IF NOT EXISTS form_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read schema"
  ON form_schemas
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update schema"
  ON form_schemas
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert schema"
  ON form_schemas
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_form_schemas_updated ON form_schemas(updated_at DESC);
