import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { CodeGenRequestSchema } from '@/lib/schemas'
import { CodeGenerator } from '@/lib/code-generator'
import type { CodeLanguage, HTTPMethod } from '@/lib/types'

export async function POST(request: NextRequest) {
  const { user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = CodeGenRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const generator = new CodeGenerator()
  try {
    const code = generator.generate(
      {
        method: parsed.data.method as HTTPMethod,
        url: parsed.data.url,
        headers: parsed.data.headers as Record<string, string> | undefined,
        queryParams: parsed.data.queryParams as Record<string, string> | undefined,
        body: parsed.data.body ?? undefined,
      },
      parsed.data.language as CodeLanguage
    )
    return Response.json({ code })
  } catch (err) {
    return Response.json(
      { error: 'Code generation failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
