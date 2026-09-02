import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children, breadcrumb }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar onToggleSidebar={() => setSidebarOpen((s) => !s)} breadcrumb={breadcrumb} />
        <main className="app-content">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
