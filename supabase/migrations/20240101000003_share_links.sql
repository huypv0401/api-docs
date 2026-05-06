-- Add editor permission type and share links

-- Update permission_type check constraint
ALTER TABLE share_permissions
  DROP CONSTRAINT IF EXISTS share_permissions_permission_type_check;
ALTER TABLE share_permissions
  ADD CONSTRAINT share_permissions_permission_type_check
  CHECK (permission_type IN ('viewer', 'editor'));

-- Share links table
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES api_documents(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL DEFAULT 'viewer' CHECK (permission_type IN ('viewer', 'editor')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_document ON share_links(document_id);
