'use client'

import { useRouter } from 'next/navigation'
import type { SharePermission } from '@/lib/types'

interface SharePermissionListProps {
  permissions: SharePermission[]
  documentId: string
  ownerId: string
}

export function SharePermissionList({ permissions, documentId, ownerId }: SharePermissionListProps) {
  const router = useRouter()

  const handleRevoke = async (userId: string | null, email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return
    const id = userId ?? email
    await fetch(`/api/documents/${documentId}/share/${encodeURIComponent(id)}`, { method: 'DELETE' })
    router.refresh()
  }

  if (permissions.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-zinc-400">No one else has access to this document.</p>
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-zinc-700" role="list">
      {permissions.map((perm) => (
        <li key={perm.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-gray-900 dark:text-zinc-100">{perm.email}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {perm.isPending ? 'Pending' : perm.permissionType === 'editor' ? 'Can edit' : 'Can view'}
            </p>
          </div>
          <button
            onClick={() => handleRevoke(perm.userId, perm.email)}
            className="rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            aria-label={`Revoke access for ${perm.email}`}
          >
            Revoke
          </button>
        </li>
      ))}
    </ul>
  )
}
