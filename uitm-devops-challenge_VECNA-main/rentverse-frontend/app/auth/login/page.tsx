'use client'

import NavBarTop from '@/components/NavBarTop'
import ModalLogIn from '@/components/ModalLogIn'
import NavBarBottom from '@/components/NavBarBottom'

/**
 * Login Page - Uses the reusable ModalLogIn component
 * Follows the original component pattern for consistency
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <NavBarTop />
      <div className="pt-20">
        <ModalLogIn isModal={false} />
      </div>
      <NavBarBottom />
    </div>
  )
}