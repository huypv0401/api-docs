// Domain model interfaces for API Documentation Manager

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export interface User {
  id: string
  email: string
  displayName: string | null
}

export interface Example {
  id: string
  endpointId: string
  type: 'request' | 'response'
  name: string
  description: string | null
  jsonContent: unknown
  statusCode: number | null
  createdAt: string
  updatedAt: string
}

export interface Endpoint {
  id: string
  documentId: string
  name: string
  method: HTTPMethod
  url: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  body: string | null
  description: string | null
  examples: Example[]
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  ownerId: string
  endpoints: Endpoint[]
  createdAt: string
  updatedAt: string
}

export interface DocumentSummary {
  id: string
  title: string
  description: string | null
  ownerId: string
  ownerEmail: string | null
  isOwner: boolean
  createdAt: string
  updatedAt: string
}

export interface SharePermission {
  id: string
  documentId: string
  userId: string | null
  email: string
  permissionType: 'viewer' | 'editor'
  isPending: boolean
  createdAt: string
}

export interface ShareLink {
  id: string
  documentId: string
  permissionType: 'viewer' | 'editor'
  createdBy: string
  createdAt: string
  url?: string
}

// Postman collection types (v2.1)
export interface PostmanUrl {
  raw: string
  protocol?: string
  host?: string[]
  path?: string[]
  query?: Array<{ key: string; value: string; disabled?: boolean }>
}

export interface PostmanHeader {
  key: string
  value: string
  disabled?: boolean
}

export interface PostmanBody {
  mode: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql'
  raw?: string
  urlencoded?: Array<{ key: string; value: string; disabled?: boolean }>
  formdata?: Array<{ key: string; value: string; disabled?: boolean }>
  options?: { raw?: { language?: string } }
}

export interface PostmanRequest {
  method: string
  url: string | PostmanUrl
  header?: PostmanHeader[]
  body?: PostmanBody
  description?: string
}

export interface PostmanResponse {
  name: string
  originalRequest?: PostmanRequest
  status?: string
  code?: number
  body?: string
  header?: PostmanHeader[]
}

export interface PostmanItem {
  name: string
  request?: PostmanRequest
  response?: PostmanResponse[]
  item?: PostmanItem[] // folder
}

export interface PostmanInfo {
  name: string
  description?: string
  schema: string
}

export interface PostmanCollection {
  info: PostmanInfo
  item: PostmanItem[]
}

// Code generation types
export type CodeLanguage = 'curl' | 'python' | 'csharp' | 'javascript' | 'go' | 'ruby'

export const CODE_LANGUAGES: CodeLanguage[] = ['curl', 'python', 'csharp', 'javascript', 'go', 'ruby']

export interface HTTPRequest {
  method: HTTPMethod
  url: string
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  body?: string
}

export interface CodeTarget {
  language: CodeLanguage
}
