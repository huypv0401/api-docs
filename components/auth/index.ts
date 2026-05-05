/**
 * Authentication components for the API Documentation Manager.
 * 
 * This module provides:
 * - LoginButton: Google OAuth sign-in button with loading and error states
 * - AuthProvider: Context provider for managing authentication state
 * - ProtectedRoute: Wrapper component for protecting authenticated routes
 * - useAuth: Hook for accessing authentication context
 * 
 * Usage:
 * 
 * Wrap your app with AuthProvider:
 * ```typescript
 * import { AuthProvider } from '@/components/auth'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>{children}</AuthProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * Protect routes:
 * ```typescript
 * import { ProtectedRoute } from '@/components/auth'
 * 
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   )
 * }
 * ```
 * 
 * Use authentication state:
 * ```typescript
 * import { useAuth } from '@/components/auth'
 * 
 * export default function Profile() {
 *   const { user, session } = useAuth()
 *   return <div>Welcome, {user?.email}</div>
 * }
 * ```
 */

export { LoginButton } from './LoginButton'
export { AuthProvider, useAuth } from './AuthProvider'
export { ProtectedRoute } from './ProtectedRoute'
