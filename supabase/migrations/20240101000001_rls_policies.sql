-- Row Level Security (RLS) Policies
-- This migration enables RLS and creates security policies for all tables
-- Implements Requirements 9.1, 9.2, 9.3, 9.4, 9.5

-- Enable RLS on all tables
ALTER TABLE api_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- API Documents Policies
-- ============================================================================

-- Policy: Users can view their own documents (Requirement 9.3)
CREATE POLICY "Users can view their own documents"
  ON api_documents FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can view documents shared with them (Requirement 9.4)
CREATE POLICY "Users can view documents shared with them"
  ON api_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_permissions
      WHERE share_permissions.document_id = api_documents.id
      AND share_permissions.user_id = auth.uid()
      AND share_permissions.is_pending = FALSE
    )
  );

-- Policy: Users can create their own documents (Requirement 9.3)
CREATE POLICY "Users can create their own documents"
  ON api_documents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own documents (Requirement 9.3)
CREATE POLICY "Users can update their own documents"
  ON api_documents FOR UPDATE
  USING (auth.uid() = owner_id);

-- Policy: Users can delete their own documents (Requirement 9.3)
CREATE POLICY "Users can delete their own documents"
  ON api_documents FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- Endpoints Policies
-- ============================================================================

-- Policy: Users can view endpoints of accessible documents (Requirement 9.1, 9.4)
-- This includes both owned documents and documents shared with the user
CREATE POLICY "Users can view endpoints of accessible documents"
  ON endpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = endpoints.document_id
      AND (
        api_documents.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM share_permissions
          WHERE share_permissions.document_id = api_documents.id
          AND share_permissions.user_id = auth.uid()
          AND share_permissions.is_pending = FALSE
        )
      )
    )
  );

-- Policy: Users can modify endpoints of owned documents (Requirement 9.3)
-- This covers INSERT, UPDATE, and DELETE operations
CREATE POLICY "Users can modify endpoints of owned documents"
  ON endpoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = endpoints.document_id
      AND api_documents.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Examples Policies
-- ============================================================================

-- Policy: Users can view examples of accessible endpoints (Requirement 9.1, 9.4)
-- This includes examples from both owned documents and documents shared with the user
CREATE POLICY "Users can view examples of accessible endpoints"
  ON examples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM endpoints
      JOIN api_documents ON api_documents.id = endpoints.document_id
      WHERE endpoints.id = examples.endpoint_id
      AND (
        api_documents.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM share_permissions
          WHERE share_permissions.document_id = api_documents.id
          AND share_permissions.user_id = auth.uid()
          AND share_permissions.is_pending = FALSE
        )
      )
    )
  );

-- Policy: Users can modify examples of owned documents (Requirement 9.3)
-- This covers INSERT, UPDATE, and DELETE operations
CREATE POLICY "Users can modify examples of owned documents"
  ON examples FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM endpoints
      JOIN api_documents ON api_documents.id = endpoints.document_id
      WHERE endpoints.id = examples.endpoint_id
      AND api_documents.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Share Permissions Policies
-- ============================================================================

-- Policy: Users can view share permissions for their documents (Requirement 9.3)
CREATE POLICY "Users can view share permissions for their documents"
  ON share_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = share_permissions.document_id
      AND api_documents.owner_id = auth.uid()
    )
  );

-- Policy: Users can create share permissions for their documents (Requirement 9.3)
CREATE POLICY "Users can create share permissions for their documents"
  ON share_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = share_permissions.document_id
      AND api_documents.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete share permissions for their documents (Requirement 9.3)
CREATE POLICY "Users can delete share permissions for their documents"
  ON share_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM api_documents
      WHERE api_documents.id = share_permissions.document_id
      AND api_documents.owner_id = auth.uid()
    )
  );
