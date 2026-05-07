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

-- RLS: allow access if the user owns the parent document
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guides_via_document" ON guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = guides.document_id
        AND api_documents.owner_id = auth.uid()
    )
  );
