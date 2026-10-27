'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { CloudShellModal } from './CloudShellModal'
import { ConnectModal } from './ConnectModal'
import { CloudflareModal } from './CloudflareModal'

export function ModalsHost() {
  const {
    server,
    setServer,
    serverList,
    setServerList,
    ociCreds,
    setOciCreds,
    setContainers,
    setProxyHosts,
    setBuckets,
    currentUser,
    doAction,
    cloudShellOpen,
    setCloudShellOpen,
    connectModalOpen,
    setConnectModalOpen,
    cloudflareModalOpen,
    setCloudflareModalOpen,
    action
  } = useWorkspace()

  return (
    <>
      {action && (
        <div className="toast">
          <Check size={15} /> {action}
        </div>
      )}

      <CloudShellModal
        isOpen={cloudShellOpen}
        onClose={() => setCloudShellOpen(false)}
        server={server}
        ociCreds={ociCreds}
        setOciCreds={setOciCreds}
        setBuckets={setBuckets}
        doAction={doAction}
      />

      <ConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        currentUser={currentUser}
        serverList={serverList}
        setServerList={setServerList}
        setServer={setServer}
        setContainers={setContainers}
        setProxyHosts={setProxyHosts}
        doAction={doAction}
      />

      <CloudflareModal
        isOpen={cloudflareModalOpen}
        onClose={() => setCloudflareModalOpen(false)}
        server={server}
        doAction={doAction}
      />
    </>
  )
}
