-- Guides table scoped to a document
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES api_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guides_document ON guides(document_id);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "guides_owner" ON guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = guides.document_id
        AND api_documents.owner_id = auth.uid()
    )
  );

-- Shared users (viewer or editor) can read
CREATE POLICY "guides_shared_select" ON guides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM share_permissions
      WHERE share_permissions.document_id = guides.document_id
        AND share_permissions.user_id = auth.uid()
        AND share_permissions.is_pending = false
    )
  );

-- Shared editors can write
CREATE POLICY "guides_shared_editor_write" ON guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM share_permissions
      WHERE share_permissions.document_id = guides.document_id
        AND share_permissions.user_id = auth.uid()
        AND share_permissions.permission_type = 'editor'
        AND share_permissions.is_pending = false
    )
  );
