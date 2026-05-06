'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SharePermission } from '@/lib/types'
import { SharePermissionList } from './SharePermissionList'

interface ShareLink { id: string; permissionType: 'viewer' | 'editor'; createdAt: string }

interface ShareDialogProps {
  documentId: string
  ownerId: string
  permissions: SharePermission[]
  shareLinks: ShareLink[]
}

const PERM_LABEL = { viewer: 'Can view', editor: 'Can edit' }
const PERM_BADGE = {
  viewer: 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export function ShareDialog({ documentId, ownerId, permissions, shareLinks: initialLinks }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [permType, setPermType] = useState<'viewer' | 'editor'>('viewer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [links, setLinks] = useState<ShareLink[]>(initialLinks)
  const [creatingLink, setCreatingLink] = useState(false)
  const [linkPerm, setLinkPerm] = useState<'viewer' | 'editor'>('viewer')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setIsSubmitting(true); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), permissionType: permType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to share')
      setEmail('')
      setSuccess(`Access granted to ${email.trim()}.`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateLink = async () => {
    setCreatingLink(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/share/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionType: linkPerm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLinks((prev) => [...prev, { id: data.id, permissionType: linkPerm, createdAt: new Date().toISOString() }])
    } finally {
      setCreatingLink(false)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    await fetch(`/api/documents/${documentId}/share/links/${linkId}`, { method: 'DELETE' })
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
  }

  const copyLink = (linkId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${linkId}`)
    setCopiedId(linkId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const inputClass = 'rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'

  return (
    <div className="space-y-6">
      {/* Email share */}
      <form onSubmit={handleShare} className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">Share with people</h3>
        <div className="flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="colleague@example.com" className={`flex-1 ${inputClass}`} />
          <select value={permType} onChange={(e) => setPermType(e.target.value as 'viewer' | 'editor')} className={inputClass}>
            <option value="viewer">Can view</option>
            <option value="editor">Can edit</option>
          </select>
          <button type="submit" disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Sharing...' : 'Share'}
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <p role="status" className="text-sm text-green-600 dark:text-green-400">{success}</p>}
      </form>

      {/* Share links */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">Share links</h3>
        <div className="flex gap-2">
          <select value={linkPerm} onChange={(e) => setLinkPerm(e.target.value as 'viewer' | 'editor')} className={inputClass}>
            <option value="viewer">Can view</option>
            <option value="editor">Can edit</option>
          </select>
          <button onClick={handleCreateLink} disabled={creatingLink}
            className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300">
            {creatingLink ? 'Creating...' : '+ Create link'}
          </button>
        </div>
        {links.length > 0 && (
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.id} className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 dark:border-zinc-700">
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${PERM_BADGE[link.permissionType]}`}>
                  {PERM_LABEL[link.permissionType]}
                </span>
                <span className="flex-1 truncate font-mono text-xs text-gray-500 dark:text-zinc-400">
                  {window?.location?.origin}/shared/{link.id}
                </span>
                <button onClick={() => copyLink(link.id)}
                  className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400">
                  {copiedId === link.id ? '✓ Copied' : 'Copy'}
                </button>
                <button onClick={() => handleDeleteLink(link.id)}
                  className="shrink-0 text-xs text-red-500 hover:text-red-700">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* People with access */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-zinc-100">People with access</h3>
        <SharePermissionList permissions={permissions} documentId={documentId} ownerId={ownerId} />
      </div>
    </div>
  )
}
