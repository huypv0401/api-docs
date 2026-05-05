'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SharePermission } from '@/lib/types'
import { SharePermissionList } from './SharePermissionList'

interface ShareDialogProps {
  documentId: string
  ownerId: string
  permissions: SharePermission[]
}

export function ShareDialog({ documentId, ownerId, permissions }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to share')
      setEmail('')
      setSuccess(data.isPending ? `Invitation sent to ${email}. They'll get access when they sign up.` : `Access granted to ${email}.`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share document')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleShare} className="space-y-3">
        <div>
          <label htmlFor="share-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Share with (email address)
          </label>
          <div className="flex gap-2">
            <input
              id="share-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="colleague@example.com"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              aria-describedby={error ? 'share-error' : success ? 'share-success' : undefined}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>

        {error && (
          <p id="share-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <p id="share-success" role="status" className="text-sm text-green-600 dark:text-green-400">{success}</p>
        )}
      </form>

      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-zinc-100">People with access</h3>
        <SharePermissionList permissions={permissions} documentId={documentId} ownerId={ownerId} />
      </div>
    </div>
  )
}
