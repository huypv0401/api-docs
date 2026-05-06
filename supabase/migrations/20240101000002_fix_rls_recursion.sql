-- Fix infinite recursion in RLS policies
-- The recursion occurs because:
--   api_documents SELECT policy → share_permissions subquery
--   share_permissions SELECT policy → api_documents subquery
--   → infinite loop
--
-- Fix: use a SECURITY DEFINER function to check document access,
-- bypassing RLS when doing the ownership/sharing lookup.

-- Drop the recursive policies
DROP POLICY IF EXISTS "Users can view their own documents" ON api_documents;
DROP POLICY IF EXISTS "Users can view documents shared with them" ON api_documents;
DROP POLICY IF EXISTS "Users can view share permissions for their documents" ON share_permissions;
DROP POLICY IF EXISTS "Users can create share permissions for their documents" ON share_permissions;
DROP POLICY IF EXISTS "Users can delete share permissions for their documents" ON share_permissions;
DROP POLICY IF EXISTS "Users can view endpoints of accessible documents" ON endpoints;
DROP POLICY IF EXISTS "Users can modify endpoints of owned documents" ON endpoints;
DROP POLICY IF EXISTS "Users can view examples of accessible endpoints" ON examples;
DROP POLICY IF EXISTS "Users can modify examples of owned documents" ON examples;

-- Helper function: check if current user can access a document (owner or shared)
-- SECURITY DEFINER bypasses RLS on the tables it queries, breaking the recursion.
CREATE OR REPLACE FUNCTION public.user_can_access_document(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api_documents
    WHERE id = doc_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM share_permissions
    WHERE document_id = doc_id
      AND user_id = auth.uid()
      AND is_pending = FALSE
  );
$$;

-- Helper function: check if current user owns a document
CREATE OR REPLACE FUNCTION public.user_owns_document(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api_documents
    WHERE id = doc_id AND owner_id = auth.uid()
  );
$$;

-- ============================================================================
-- api_documents policies (no recursion: ownership check is direct column compare)
-- ============================================================================

CREATE POLICY "Users can view accessible documents"
  ON api_documents FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM share_permissions
      WHERE document_id = api_documents.id
        AND user_id = auth.uid()
        AND is_pending = FALSE
    )
  );

CREATE POLICY "Users can create their own documents"
  ON api_documents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own documents"
  ON api_documents FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own documents"
  ON api_documents FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- share_permissions policies (use SECURITY DEFINER function to avoid recursion)
-- ============================================================================

CREATE POLICY "Users can view share permissions for their documents"
  ON share_permissions FOR SELECT
  USING (public.user_owns_document(document_id));

CREATE POLICY "Users can create share permissions for their documents"
  ON share_permissions FOR INSERT
  WITH CHECK (public.user_owns_document(document_id));

CREATE POLICY "Users can delete share permissions for their documents"
  ON share_permissions FOR DELETE
  USING (public.user_owns_document(document_id));

-- ============================================================================
-- endpoints policies
-- ============================================================================

CREATE POLICY "Users can view endpoints of accessible documents"
  ON endpoints FOR SELECT
  USING (public.user_can_access_document(document_id));

CREATE POLICY "Users can modify endpoints of owned documents"
  ON endpoints FOR ALL
  USING (public.user_owns_document(document_id));

-- ============================================================================
-- examples policies
-- ============================================================================

CREATE POLICY "Users can view examples of accessible endpoints"
  ON examples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM endpoints
      WHERE endpoints.id = examples.endpoint_id
        AND public.user_can_access_document(endpoints.document_id)
    )
  );

CREATE POLICY "Users can modify examples of owned endpoints"
  ON examples FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM endpoints
      WHERE endpoints.id = examples.endpoint_id
        AND public.user_owns_document(endpoints.document_id)
    )
  );
