import Link from 'next/link'
import { Shield } from 'lucide-react'

export function AdminNavigationLinks() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Shield className="w-4 h-4" />
          <span>Security Dashboard</span>
        </Link>
      </div>
    </div>
  )
}