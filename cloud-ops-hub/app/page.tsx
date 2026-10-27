'use client'

import React from 'react'
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext'
import { LoginView } from '../components/LoginView'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { WorkspaceViewRouter } from '../components/WorkspaceViewRouter'
import { ModalsHost } from '../components/ModalsHost'

function WorkspaceShell() {
  const { currentUser, setCurrentUser, doAction } = useWorkspace()

  if (!currentUser) {
    return (
      <LoginView
        onSuccess={(user) => {
          setCurrentUser(user)
          doAction(`Bem-vindo ao CloudOps Hub, ${user.name}! 🚀`)
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <section className="main-content">
        <Topbar />
        <WorkspaceViewRouter />
      </section>
      <ModalsHost />
    </main>
  )
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  )
}
