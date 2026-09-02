import React from 'react'

export default function Footer() {
  return (
    <footer className="text-center text-muted small py-3 border-top mt-auto" style={{ background: '#fff' }}>
      © {new Date().getFullYear()} Smart Training Management System — BCA Capstone Project
    </footer>
  )
}
