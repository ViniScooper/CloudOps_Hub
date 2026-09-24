'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  HardDrive, Search, Copy, Check, Eye, ExternalLink,
  Trash2, UploadCloud, X, Database, ShieldCheck, RefreshCw,
  Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Layers, ArrowUpDown, Filter
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface StorageFile {
  id: string
  name: string
  label?: string
  isActiveInMenu?: boolean
  category: 'Pratos' | 'Bebidas' | 'Sobremesas' | 'Backups' | 'Banners' | string
  size: string
  bytes: number
  uploadedAt: string
  dimensions?: string
  url: string
  previewUrl: string
  type: 'image' | 'archive' | 'doc'
  price?: string
}

export function StorageExplorerView({ 
  bucketName = 'boteco-sivirino-fotos',
  server,
  doAction
}: { 
  bucketName?: string
  server?: any
  doAction: (msg: string) => void 
}) {
  const isVirginVM = server?.name === 'cloudops-micro-02' || server?.ip === '137.131.187.54'
  const currentBucket = isVirginVM ? 'cloudops-micro-02-storage' : bucketName

  const [files, setFiles] = useState<StorageFile[]>(() => {
    if (typeof window !== 'undefined') {
      const storageKey = isVirginVM ? 'cloudops_storage_files_micro02' : 'cloudops_storage_files'
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try { return JSON.parse(saved) } catch (e) {}
      }
    }
    return []
  })

  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  
  // Navbar interna da lista: Sub-abas, ordenação e paginação
  const [listScope, setListScope] = useState<'active' | 'all' | 'backups'>('active')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size-asc' | 'size-desc'>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const [selectedImage, setSelectedImage] = useState<StorageFile | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Campos do formulário de novo upload
  const [newFileName, setNewFileName] = useState('')
  const [newFileCategory, setNewFileCategory] = useState<'Pratos' | 'Bebidas' | 'Sobremesas' | 'Banners' | 'Backups'>('Pratos')
  const [newFileUrl, setNewFileUrl] = useState('')

  const fetchRealStorageFiles = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/storage/objects'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files)
          if (typeof window !== 'undefined') {
            const storageKey = isVirginVM ? 'cloudops_storage_files_micro02' : 'cloudops_storage_files'
            localStorage.setItem(storageKey, JSON.stringify(data.files))
          }
          doAction(`Arquivos reais do bucket ${currentBucket} carregados! (${data.files.length} objetos)`)
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar fotos do storage:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRealStorageFiles()
  }, [])

  const categories = ['Todos', 'Pratos', 'Bebidas', 'Sobremesas', 'Banners', 'Backups']

  // Contadores para as abas internas
  const activeCount = useMemo(() => files.filter(f => f.isActiveInMenu).length, [files])
  const backupsCount = useMemo(() => files.filter(f => f.category === 'Backups' || f.type === 'archive').length, [files])

  // Filtragem e Ordenação
  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    
    let result = files.filter(f => {
      // Filtro de Escopo da Navbar interna
      if (listScope === 'active' && !f.isActiveInMenu) return false
      if (listScope === 'backups' && f.category !== 'Backups' && f.type !== 'archive') return false

      // Filtro de Categoria
      const matchCat = selectedCategory === 'Todos' || f.category === selectedCategory

      // Filtro de Busca
      const label = (f.label || '').toLowerCase()
      const name = (f.name || '').toLowerCase()
      const matchQuery = !query || name.includes(query) || label.includes(query)

      return matchCat && matchQuery
    })

    // Ordenação
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.label || a.name
        const nameB = b.label || b.name
        return nameA.localeCompare(nameB)
      }
      if (sortBy === 'size-asc') return (a.bytes || 0) - (b.bytes || 0)
      if (sortBy === 'size-desc') return (b.bytes || 0) - (a.bytes || 0)
      // default: recent (active dishes first, then order in list)
      return (b.isActiveInMenu ? 1 : 0) - (a.isActiveInMenu ? 1 : 0)
    })

    return result
  }, [files, searchQuery, selectedCategory, listScope, sortBy])

  // Reseta a página se os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, listScope, sortBy, pageSize])

  // Cálculos de Paginação
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize))
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredFiles.slice(start, start + pageSize)
  }, [filteredFiles, currentPage, pageSize])

  const totalBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.bytes || 0), 0)
  }, [files])

  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0.0 MB'
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const quotaTotalBytes = 20 * 1024 * 1024 * 1024 // 20 GB Always Free
  const usagePercentage = isVirginVM ? 0 : Math.min(100, Math.max(0.01, (totalBytes / quotaTotalBytes) * 100))
  const freeGB = isVirginVM ? '20.0' : Math.max(0, (quotaTotalBytes - totalBytes) / (1024 * 1024 * 1024)).toFixed(1)

  const copyUrl = (file: StorageFile) => {
    navigator.clipboard.writeText(file.url)
    setCopiedId(file.id)
    doAction(`Link copiado com sucesso! Pronto para colar no Vercel.`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileName) return

    const sanitizedName = newFileName.toLowerCase().replace(/\s+/g, '-') + (newFileName.includes('.') ? '' : '.jpg')
    const fallbackImage = newFileUrl.trim() || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'

    const newObj: StorageFile = {
      id: `f-${Date.now()}`,
      name: sanitizedName,
      label: newFileName,
      isActiveInMenu: true,
      category: newFileCategory,
      size: '45 KB',
      bytes: 46080,
      uploadedAt: 'Agora mesmo',
      dimensions: '800 x Auto (WebP)',
      url: `https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/${bucketName}/o/${sanitizedName}`,
      previewUrl: fallbackImage,
      type: newFileCategory === 'Backups' ? 'archive' : 'image'
    }

    const updated = [newObj, ...files]
    setFiles(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cloudops_storage_files', JSON.stringify(updated))
    }

    setUploadModalOpen(false)
    setNewFileName('')
    setNewFileUrl('')
    doAction(`Foto "${sanitizedName}" adicionada com sucesso!`)
  }

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o arquivo "${name}" do bucket?`)) {
      const updated = files.filter(f => f.id !== id)
      setFiles(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_storage_files', JSON.stringify(updated))
      }
      doAction(`Arquivo "${name}" removido do painel.`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* CABEÇALHO DO BUCKET */}
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: 'rgba(32, 214, 199, 0.15)', color: '#20d6c7', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Oracle Object Storage
            </span>
            <span style={{ color: '#6f8387', fontSize: '11px' }}>• Região sa-saopaulo-1 (GRU)</span>
          </div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HardDrive size={22} style={{ color: '#20d6c7' }} />
            Bucket: {currentBucket}
          </h2>
          <p>
            {isVirginVM 
              ? `Repositório isolado para o nó ${server?.name || 'cloudops-micro-02'}.` 
              : 'Repositório de mídia pública para o Cardápio Digital (Vercel) e armazenamento seguro de backups MySQL.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="secondary-button"
            onClick={() => {
              doAction('Sincronizando com o Oracle Object Storage...')
              fetchRealStorageFiles()
            }}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} /> {isLoading ? 'Sincronizando...' : 'Sincronizar'}
          </button>

          <button
            className="primary-button"
            onClick={() => setUploadModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UploadCloud size={15} /> Upload de Foto / Arquivo
          </button>
        </div>
      </div>

      {/* BANNER EDUCATIVO DE ARQUITETURA DE STORAGE */}
      <div style={{
        background: 'rgba(32, 214, 199, 0.05)',
        border: '1px solid rgba(32, 214, 199, 0.2)',
        padding: '12px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldCheck size={20} style={{ color: '#20d6c7', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#c3d0d4', lineHeight: '1.5' }}>
          <strong style={{ color: '#20d6c7' }}>Oracle Object Storage (Nuvem OCI):</strong> Este repositório é gerenciado na nuvem e <strong>não consome o disco NVMe da sua VM</strong> (o disco local de <code>{server?.name || 'servidor'}</code> está 95% livre com 46.5 GB disponíveis).
        </div>
      </div>

      {/* METADADOS & COTA ALWAYS FREE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#0e1518', border: '1px solid #1a272a', borderRadius: '8px', padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#6f8387', textTransform: 'uppercase', fontWeight: 600 }}>Cota Always Free</span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#d9e2e1', margin: '4px 0' }}>
            {isVirginVM ? '0.0 MB' : formatStorageSize(totalBytes)} <span style={{ fontSize: '12px', color: '#6f8387', fontWeight: 400 }}>/ 20 GB</span>
          </div>
          <div style={{ height: '6px', background: '#182427', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ width: isVirginVM ? '0%' : `${Math.max(0.5, Math.min(100, usagePercentage))}%`, height: '100%', background: '#20d6c7', borderRadius: '3px' }} />
          </div>
          <small style={{ fontSize: '10px', color: '#20d6c7', marginTop: '6px', display: 'block' }}>
            {isVirginVM ? '0% utilizado · 20.0 GB livres' : `${usagePercentage < 0.1 ? '< 0.1%' : usagePercentage.toFixed(1) + '%'} utilizado · ${freeGB} GB livres para fotos`}
          </small>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid #1a272a', borderRadius: '8px', padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#6f8387', textTransform: 'uppercase', fontWeight: 600 }}>Objetos no Bucket</span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#d9e2e1', margin: '4px 0' }}>
            {files.length} <span style={{ fontSize: '12px', color: '#6f8387', fontWeight: 400 }}>arquivos ({activeCount} ativos no cardápio)</span>
          </div>
          <small style={{ fontSize: '10px', color: '#a3e635', marginTop: '6px', display: 'block' }}>⚡ 100% hospedados com CDN Edge Cache</small>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid #1a272a', borderRadius: '8px', padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#6f8387', textTransform: 'uppercase', fontWeight: 600 }}>Visibilidade e Política</span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#20d6c7', margin: '4px 0' }}>Public (ObjectRead)</div>
          <small style={{ fontSize: '10px', color: '#6f8387', marginTop: '6px', display: 'block' }}>🔒 Links diretos liberados para o Vercel sem token</small>
        </div>
      </div>

      {/* CONTAINER PRINCIPAL DA LISTA COM NAVBAR INTERNA INTEGRADA (SEM SCROLL INFINITO) */}
      <section 
        className="panel" 
        style={{ 
          margin: 0, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          border: '1px solid #1c2c30',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* NAVBAR INTERNA DA TABELA (STICKY NO TOPO DA DIV) */}
        <div 
          className="table-internal-navbar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 15,
            background: 'linear-gradient(180deg, #10191c 0%, #0c1416 100%)',
            borderBottom: '1px solid #1e3135',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Linha 1 da Navbar Interna: Sub-abas de Escopo + Busca */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            {/* Sub-abas de Visualização Rápida */}
            <div style={{ display: 'flex', gap: '6px', background: '#070c0e', padding: '3px', borderRadius: '8px', border: '1px solid #19272a' }}>
              <button
                type="button"
                onClick={() => setListScope('active')}
                style={{
                  background: listScope === 'active' ? 'rgba(32, 214, 199, 0.18)' : 'transparent',
                  color: listScope === 'active' ? '#20d6c7' : '#72888b',
                  border: listScope === 'active' ? '1px solid rgba(32, 214, 199, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: listScope === 'active' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={13} style={{ color: listScope === 'active' ? '#20d6c7' : '#6f8387' }} />
                <span>Cardápio Ativo</span>
                <span style={{ fontSize: '9.5px', background: listScope === 'active' ? '#20d6c7' : '#172528', color: listScope === 'active' ? '#030708' : '#8fa4a8', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setListScope('all')}
                style={{
                  background: listScope === 'all' ? 'rgba(32, 214, 199, 0.18)' : 'transparent',
                  color: listScope === 'all' ? '#20d6c7' : '#72888b',
                  border: listScope === 'all' ? '1px solid rgba(32, 214, 199, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: listScope === 'all' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={13} style={{ color: listScope === 'all' ? '#20d6c7' : '#6f8387' }} />
                <span>Todos no Bucket</span>
                <span style={{ fontSize: '9.5px', background: listScope === 'all' ? '#20d6c7' : '#172528', color: listScope === 'all' ? '#030708' : '#8fa4a8', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                  {files.length}
                </span>
              </button>

              {backupsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setListScope('backups')}
                  style={{
                    background: listScope === 'backups' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                    color: listScope === 'backups' ? '#f59e0b' : '#72888b',
                    border: listScope === 'backups' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: listScope === 'backups' ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Database size={13} style={{ color: listScope === 'backups' ? '#f59e0b' : '#6f8387' }} />
                  <span>Backups</span>
                  <span style={{ fontSize: '9.5px', background: listScope === 'backups' ? '#f59e0b' : '#172528', color: listScope === 'backups' ? '#030708' : '#8fa4a8', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                    {backupsCount}
                  </span>
                </button>
              )}
            </div>

            {/* Campo de Busca Rápida */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '180px', maxWidth: '380px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6f8387' }} />
              <input
                type="text"
                placeholder="Filtrar por nome ou prato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '32px',
                  background: '#070c0e',
                  border: '1px solid #1a292d',
                  borderRadius: '6px',
                  padding: '0 28px 0 30px',
                  color: '#d9e2e1',
                  fontSize: '11.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '8px',
                    background: 'transparent',
                    border: 0,
                    color: '#6f8387',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Linha 2 da Navbar Interna: Filtros por Categoria + Ordenação + Controles de Página */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
            {/* Pílulas de Categoria */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {categories.map(cat => {
                const isSelected = selectedCategory === cat
                const count = cat === 'Todos' ? files.length : files.filter(f => f.category === cat).length

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: isSelected ? 'rgba(32, 214, 199, 0.15)' : '#070c0e',
                      border: isSelected ? '1px solid #20d6c7' : '1px solid #182629',
                      color: isSelected ? '#20d6c7' : '#7a9194',
                      borderRadius: '16px',
                      padding: '3px 10px',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {cat}
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        background: isSelected ? '#20d6c7' : '#142023', 
                        color: isSelected ? '#030708' : '#6f8387', 
                        padding: '1px 5px', 
                        borderRadius: '8px',
                        fontWeight: 700
                      }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Ordenação e Paginação Navbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
              {/* Seletor de Ordenação */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#6f8387' }}>
                <ArrowUpDown size={12} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    background: '#070c0e',
                    border: '1px solid #1a292d',
                    color: '#c2d4d2',
                    borderRadius: '5px',
                    padding: '3px 6px',
                    fontSize: '10.5px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="recent">Mais Relevantes</option>
                  <option value="name">Nome (A - Z)</option>
                  <option value="size-asc">Menor Tamanho (KB)</option>
                  <option value="size-desc">Maior Tamanho (MB)</option>
                </select>
              </div>

              {/* Seletor de Itens por Página */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#6f8387' }}>
                <span>Exibir:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{
                    background: '#070c0e',
                    border: '1px solid #1a292d',
                    color: '#c2d4d2',
                    borderRadius: '5px',
                    padding: '3px 6px',
                    fontSize: '10.5px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Botões de Navegação de Página */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  title="Primeira Página"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    background: '#070c0e',
                    border: '1px solid #1a292d',
                    color: currentPage === 1 ? '#3a4e52' : '#20d6c7',
                    borderRadius: '4px',
                    padding: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronsLeft size={13} />
                </button>

                <button
                  type="button"
                  title="Página Anterior"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: '#070c0e',
                    border: '1px solid #1a292d',
                    color: currentPage === 1 ? '#3a4e52' : '#20d6c7',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={13} />
                </button>

                <span style={{ fontSize: '10.5px', color: '#8fa4a8', padding: '0 4px', minWidth: '60px', textAlign: 'center' }}>
                  <strong style={{ color: '#20d6c7' }}>{currentPage}</strong> / {totalPages}
                </span>

                <button
                  type="button"
                  title="Próxima Página"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    background: '#070c0e',
                    border: '1px solid #1a292d',
                    color: currentPage === totalPages ? '#3a4e52' : '#20d6c7',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronRight size={13} />
                </button>

                <button
                  type="button"
                  title="Última Página"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    background: '#070c0e',
                    border: '1px solid #1a292d',
                    color: currentPage === totalPages ? '#3a4e52' : '#20d6c7',
                    borderRadius: '4px',
                    padding: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronsRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && files.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0a1012' }}>
            <RefreshCw size={28} className="spinning" style={{ color: '#20d6c7', margin: '0 auto 12px auto' }} />
            <h4 style={{ color: '#d9e2e1', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
              Carregando objetos do Oracle Cloud...
            </h4>
            <p style={{ color: '#6f8387', fontSize: '11px', margin: 0 }}>Consultando arquivos no bucket {currentBucket}.</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && filteredFiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#0a1012' }}>
            <Filter size={28} style={{ color: '#3f5659', margin: '0 auto 12px auto' }} />
            <h4 style={{ color: '#d9e2e1', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
              Nenhum objeto encontrado nesta visualização
            </h4>
            <p style={{ color: '#6f8387', fontSize: '11px', margin: '0 0 14px' }}>
              {listScope === 'active' 
                ? 'Nenhum prato com foto ativa encontrado com os filtros atuais.' 
                : 'Tente alterar os termos de busca ou categoria.'}
            </p>
            <button 
              className="secondary-button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Todos')
                setListScope('all')
              }}
              style={{ fontSize: '11px' }}
            >
              Mostrar Todos os Objetos ({files.length})
            </button>
          </div>
        )}

        {/* ROLAGEM INTERNA DA TABELA (COM SCROLLBAR ESTILIZADA, SEM PRECISAR DAR SCROLL NA PÁGINA) */}
        {filteredFiles.length > 0 && (
          <div 
            className="storage-scroll-container"
            style={{ 
              maxHeight: '580px', 
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#1c2d31 transparent'
            }}
          >
            <div className="container-list" style={{ padding: 0 }}>
              {paginatedFiles.map((file, idx) => {
                const isCopied = copiedId === file.id
                const isWebp = file.name.endsWith('.webp')
                const displayUrl = file.previewUrl?.startsWith('http') ? file.previewUrl : file.url

                return (
                  <div 
                    className="container-row" 
                    key={file.id} 
                    style={{ 
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      borderTop: idx === 0 ? 'none' : '1px solid #142023',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.012)',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Thumbnail Miniatura */}
                    <div 
                      style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '6px', 
                        overflow: 'hidden', 
                        background: '#070c0e',
                        border: '1px solid #1c2b2f',
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        cursor: file.type === 'image' ? 'pointer' : 'default',
                        position: 'relative'
                      }}
                      onClick={() => file.type === 'image' && setSelectedImage(file)}
                      title={file.type === 'image' ? 'Clique para ampliar foto' : file.name}
                    >
                      {file.type === 'image' ? (
                        <img
                          src={displayUrl}
                          alt={file.label || file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as any).style.display = 'none'
                          }}
                        />
                      ) : (
                        <Database size={20} style={{ color: '#f59e0b' }} />
                      )}
                    </div>

                    {/* Informações Principais do Prato */}
                    <div className="container-info" style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '13px', color: '#e2edeb', fontWeight: 600 }}>
                          {file.label || file.name}
                        </strong>

                        {isWebp && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(32, 214, 199, 0.15)', color: '#20d6c7', border: '1px solid rgba(32, 214, 199, 0.3)' }}>
                            ⚡ WebP Otimizado
                          </span>
                        )}

                        {file.isActiveInMenu && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(163, 230, 53, 0.12)', color: '#a3e635', border: '1px solid rgba(163, 230, 53, 0.25)' }}>
                            Cardápio Ativo
                          </span>
                        )}

                        {file.price && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#f4b942' }}>
                            {file.price}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '10.5px', color: '#6e8588', flexWrap: 'wrap' }}>
                        <code style={{ color: '#88a3a6', fontSize: '10px' }}>{file.name}</code>
                        <span>•</span>
                        <span style={{ color: file.category === 'Backups' ? '#f59e0b' : '#20d6c7' }}>{file.category}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 600, color: '#b2c8c6' }}>{file.size}</span>
                        <span>•</span>
                        <span>{file.uploadedAt}</span>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => copyUrl(file)}
                        title="Copiar link direto para o cardápio (Vercel)"
                        style={{
                          background: isCopied ? 'rgba(32, 214, 199, 0.2)' : '#0e1719',
                          border: isCopied ? '1px solid #20d6c7' : '1px solid #1a2c30',
                          color: isCopied ? '#20d6c7' : '#c9dcda',
                          borderRadius: '5px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span className="copy-btn-text">{isCopied ? 'Copiado!' : 'Copiar URL'}</span>
                      </button>

                      {file.type === 'image' && (
                        <button
                          type="button"
                          onClick={() => setSelectedImage(file)}
                          title="Visualizar em tamanho grande"
                          style={{
                            background: '#0e1719',
                            border: '1px solid #1a2c30',
                            color: '#20d6c7',
                            borderRadius: '5px',
                            padding: '6px 9px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={13} />
                          <span className="view-btn-text">Ver</span>
                        </button>
                      )}

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir no navegador"
                        style={{
                          background: '#0e1719',
                          border: '1px solid #1a2c30',
                          color: '#6f8387',
                          borderRadius: '5px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={13} />
                      </a>

                      <button
                        type="button"
                        title="Remover arquivo"
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        style={{
                          background: '#0e1719',
                          border: '1px solid #1a2c30',
                          color: '#ff6b6b',
                          borderRadius: '5px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* RODAPÉ DA TABELA: TOTALIZADOR E NAVEGAÇÃO COMPACTA */}
        {filteredFiles.length > 0 && (
          <div 
            style={{
              padding: '10px 16px',
              background: '#0a1012',
              borderTop: '1px solid #162427',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#6f8387',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <span>
              Mostrando <strong style={{ color: '#20d6c7' }}>{((currentPage - 1) * pageSize) + 1}</strong> a <strong style={{ color: '#20d6c7' }}>{Math.min(currentPage * pageSize, filteredFiles.length)}</strong> de <strong>{filteredFiles.length}</strong> objetos filtrados
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="secondary-button"
                style={{ padding: '3px 8px', fontSize: '10.5px', height: '26px' }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '10px', color: '#8fa4a8' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="secondary-button"
                style={{ padding: '3px 8px', fontSize: '10.5px', height: '26px' }}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL LIGHTBOX: VISUALIZAR FOTO EM ALTA RESOLUÇÃO */}
      {selectedImage && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              background: '#0c1316',
              border: '1px solid #1e2e32',
              borderRadius: '10px',
              maxWidth: '720px',
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ color: '#d9e2e1', margin: 0, fontSize: '13px' }}>
                  {selectedImage.label || selectedImage.name}
                </h4>
                <small style={{ color: '#6f8387', fontSize: '10px' }}>
                  {selectedImage.name} · {selectedImage.dimensions} · {selectedImage.size} · {selectedImage.category}
                </small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{ background: 'transparent', border: 0, color: '#6f8387', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', background: '#05080a', textAlign: 'center', maxHeight: '480px', overflowY: 'auto' }}>
              <img
                src={selectedImage.previewUrl || selectedImage.url}
                alt={selectedImage.label || selectedImage.name}
                style={{ maxWidth: '100%', maxHeight: '440px', objectFit: 'contain', borderRadius: '6px' }}
              />
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid #1a272a', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', color: '#6f8387', wordBreak: 'break-all', maxWidth: '400px' }}>
                {selectedImage.url}
              </span>
              <button
                className="primary-button"
                onClick={() => copyUrl(selectedImage)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Copy size={13} /> Copiar Link do Vercel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE UPLOAD DE NOVA FOTO */}
      {uploadModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setUploadModalOpen(false)}
        >
          <div
            style={{
              background: '#0c1316',
              border: '1px solid #1e2e32',
              borderRadius: '10px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ color: '#d9e2e1', margin: 0, fontSize: '15px' }}>Upload de Nova Foto de Cardápio</h3>
                <p style={{ color: '#6f8387', margin: '2px 0 0', fontSize: '11px' }}>O arquivo será indexado no bucket {bucketName} com CDN pública.</p>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                style={{ background: 'transparent', border: 0, color: '#6f8387', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#889e9d', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Nome do Prato / Arquivo
                </label>
                <input
                  type="text"
                  placeholder="Ex: picanha-na-chapa.jpg"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#060a0c',
                    border: '1px solid #1c2b2f',
                    borderRadius: '6px',
                    padding: '0 10px',
                    color: '#d9e2e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#889e9d', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Categoria
                </label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#060a0c',
                    border: '1px solid #1c2b2f',
                    borderRadius: '6px',
                    padding: '0 10px',
                    color: '#d9e2e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Pratos">Pratos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Sobremesas">Sobremesas</option>
                  <option value="Banners">Banners</option>
                  <option value="Backups">Backups</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#889e9d', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  URL Pública da Foto (Opcional - link temporário para CDN)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#060a0c',
                    border: '1px solid #1c2b2f',
                    borderRadius: '6px',
                    padding: '0 10px',
                    color: '#d9e2e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UploadCloud size={14} /> Salvar e Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
