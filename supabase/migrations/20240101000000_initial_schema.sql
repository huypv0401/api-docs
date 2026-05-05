-- Initial database schema for API Documentation Manager
-- This migration creates all tables, indexes, and constraints

-- API Documents table
-- Stores the main API documentation records
CREATE TABLE api_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient owner-based queries
CREATE INDEX idx_api_documents_owner ON api_documents(owner_id);

-- Endpoints table
-- Stores individual API endpoints within documents
CREATE TABLE endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES api_documents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')),
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  query_params JSONB DEFAULT '{}',
  body TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient document-based endpoint queries
CREATE INDEX idx_endpoints_document ON endpoints(document_id);

-- Examples table
-- Stores request and response examples for endpoints
CREATE TABLE examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('request', 'response')),
  name TEXT NOT NULL,
  description TEXT,
  json_content JSONB NOT NULL,
  status_code INTEGER, -- for response examples only
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient endpoint-based example queries
CREATE INDEX idx_examples_endpoint ON examples(endpoint_id);

-- Share Permissions table
-- Stores document sharing permissions
CREATE TABLE share_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES api_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- stores email for pending permissions
  permission_type TEXT NOT NULL DEFAULT 'viewer' CHECK (permission_type IN ('viewer')),
  is_pending BOOLEAN DEFAULT FALSE, -- true if user hasn't registered yet
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient permission queries
CREATE INDEX idx_share_permissions_document ON share_permissions(document_id);
CREATE INDEX idx_share_permissions_user ON share_permissions(user_id);
CREATE INDEX idx_share_permissions_email ON share_permissions(email);

-- Unique constraint to prevent duplicate permissions for the same user and document
-- Only applies when user_id is not null (registered users)
CREATE UNIQUE INDEX idx_share_permissions_unique ON share_permissions(document_id, user_id) WHERE user_id IS NOT NULL;
