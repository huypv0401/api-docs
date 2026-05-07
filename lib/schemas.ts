import { z } from 'zod'
import { HTTP_METHODS, CODE_LANGUAGES } from './types'

export const HTTPMethodSchema = z.enum(HTTP_METHODS as [string, ...string[]])

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
})

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
})

export const CreateEndpointSchema = z.object({
  name: z.string().min(1).max(255),
  method: HTTPMethodSchema,
  url: z.string().min(1).max(2048),
  headers: z.record(z.string(), z.string()).optional().default({}),
  queryParams: z.record(z.string(), z.string()).optional().default({}),
  body: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
})

export const UpdateEndpointSchema = CreateEndpointSchema.partial()

export const CreateExampleSchema = z.object({
  type: z.enum(['request', 'response']),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  jsonContent: z.string().min(1),
  statusCode: z.number().int().min(100).max(599).nullable().optional(),
  responseHeaders: z.record(z.string(), z.string()).nullable().optional(),
})

export const ShareDocumentSchema = z.object({
  email: z.string().email(),
  permissionType: z.enum(['viewer', 'editor']).optional().default('viewer'),
})

export const CodeGenRequestSchema = z.object({
  method: HTTPMethodSchema,
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  body: z.string().nullable().optional(),
  language: z.enum(CODE_LANGUAGES as [string, ...string[]]),
})

export const CreateGuideSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().default(''),
  coverImageUrl: z.string().url().nullable().optional(),
})

export const UpdateGuideSchema = CreateGuideSchema.partial()

export type CreateGuideInput = z.infer<typeof CreateGuideSchema>
export type UpdateGuideInput = z.infer<typeof UpdateGuideSchema>

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>
export type CreateEndpointInput = z.infer<typeof CreateEndpointSchema>
export type UpdateEndpointInput = z.infer<typeof UpdateEndpointSchema>
export type CreateExampleInput = z.infer<typeof CreateExampleSchema>
export type ShareDocumentInput = z.infer<typeof ShareDocumentSchema>
export type CodeGenRequestInput = z.infer<typeof CodeGenRequestSchema>
