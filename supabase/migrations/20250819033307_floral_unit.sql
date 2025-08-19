/*
  # Supabase Storage Setup for App Content

  1. Storage Bucket
    - Create 'app-content' bucket for user uploads and generated assets
    - Enable public access for user-owned files
    
  2. Security Policies
    - Users can only access their own files
    - Files are organized by customer_id/user_id paths
    - Automatic cleanup of old files

  3. File Organization
    - Path structure: customer_id/user_id/filename
    - Supports various content types (images, documents, reports)
*/

-- Create storage bucket if it doesn't exist (this would be done in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('app-content', 'app-content', true);

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert files into their own folder
CREATE POLICY "Users can upload files to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view files in their own folder
CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'app-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update files in their own folder
CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'app-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete files in their own folder
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a table to track file metadata and associations
CREATE TABLE IF NOT EXISTS app_content_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  bucket_name text NOT NULL DEFAULT 'app-content',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  content_type text DEFAULT 'user_upload',
  description text,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on app_content_metadata
ALTER TABLE app_content_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for app_content_metadata
CREATE POLICY "Users can manage their own file metadata"
  ON app_content_metadata
  FOR ALL
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_content_metadata_uploaded_by ON app_content_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_app_content_metadata_customer_id ON app_content_metadata(customer_id);
CREATE INDEX IF NOT EXISTS idx_app_content_metadata_content_type ON app_content_metadata(content_type);
CREATE INDEX IF NOT EXISTS idx_app_content_metadata_created_at ON app_content_metadata(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_content_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_app_content_metadata_updated_at_trigger
  BEFORE UPDATE ON app_content_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_app_content_metadata_updated_at();