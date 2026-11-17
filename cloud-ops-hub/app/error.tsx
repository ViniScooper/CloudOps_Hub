'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CloudOps Hub ErrorBoundary]', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d10',
        color: '#f0fdfa',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#11181c',
          border: '1px solid #1e2b30',
          borderRadius: '14px',
          padding: '28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            marginBottom: '14px',
          }}
        >
          <AlertTriangle size={28} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
          Algo deu errado na interface
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#8ea3a6', lineHeight: 1.5 }}>
          {error?.message || 'Ocorreu um erro inesperado ao renderizar esta tela.'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#20d6c7',
            color: '#071012',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={15} />
          Tentar Novamente
        </button>
      </div>
    </div>
  )
}
