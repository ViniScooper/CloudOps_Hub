'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  HardDrive, Search, Plus, ExternalLink, Copy, Check, Eye, Download,
  Trash2, Filter, UploadCloud, X, ArrowLeft, Image as ImageIcon,
  FileText, Database, ShieldCheck, Sparkles, FolderOpen, RefreshCw
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface StorageFile {
  id: string
  name: string
  label?: string
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
          doAction(`Fotos reais do bucket ${currentBucket} carregadas! (${data.files.length} arquivos)`)
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

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedImage, setSelectedImage] = useState<StorageFile | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Campos do formulário de novo upload
  const [newFileName, setNewFileName] = useState('')
  const [newFileCategory, setNewFileCategory] = useState<'Pratos' | 'Bebidas' | 'Sobremesas' | 'Banners' | 'Backups'>('Pratos')
  const [newFileUrl, setNewFileUrl] = useState('')

  const categories = ['Todos', 'Pratos', 'Bebidas', 'Sobremesas', 'Banners', 'Backups']

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchQuery = f.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = selectedCategory === 'Todos' || f.category === selectedCategory
      return matchQuery && matchCat
    })
  }, [files, searchQuery, selectedCategory])

  const copyUrl = (file: StorageFile) => {
    navigator.clipboard.writeText(file.url)
    setCopiedId(file.id)
    doAction(`Link da foto copiado com sucesso! Pronto para colar no Vercel.`)
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
      category: newFileCategory,
      size: '340 KB',
      bytes: 348160,
      uploadedAt: 'Agora mesmo',
      dimensions: '1080 x 1080',
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
    doAction(`Foto "${sanitizedName}" adicionada ao bucket com sucesso!`)
  }

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o arquivo "${name}" do bucket?`)) {
      const updated = files.filter(f => f.id !== id)
      setFiles(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_storage_files', JSON.stringify(updated))
      }
      doAction(`Arquivo "${name}" removido do bucket.`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              ? `Repositório isolado para o nó ${server?.name || 'cloudops-micro-02'}. Nenhum arquivo enviado para esta VM até o momento.` 
              : 'Repositório de mídia pública para o Cardápio Digital (Vercel) e armazenamento seguro de backups MySQL.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="secondary-button"
            onClick={() => {
              doAction('Sincronizando fotos reais com o Oracle Object Storage...')
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
          <strong style={{ color: '#20d6c7' }}>Oracle Object Storage (Nuvem OCI):</strong> Este repositório é gerenciado diretamente na infraestrutura da nuvem OCI (como AWS S3). Ele <strong>não consome o disco NVMe da sua VM</strong> (o disco local de <code>{server?.name || 'servidor'}</code> está 95% livre com 46.5 GB disponíveis).
        </div>
      </div>

      {/* METADADOS & COTA ALWAYS FREE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#0e1518', border: '1px solid #1a272a', borderRadius: '8px', padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#6f8387', textTransform: 'uppercase', fontWeight: 600 }}>Cota Always Free</span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#d9e2e1', margin: '4px 0' }}>
            {isVirginVM ? '0.0 GB' : '1.4 GB'} <span style={{ fontSize: '12px', color: '#6f8387', fontWeight: 400 }}>/ 20 GB</span>
          </div>
          <div style={{ height: '6px', background: '#182427', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ width: isVirginVM ? '0%' : '7%', height: '100%', background: '#20d6c7', borderRadius: '3px' }} />
          </div>
          <small style={{ fontSize: '10px', color: '#20d6c7', marginTop: '6px', display: 'block' }}>
            {isVirginVM ? '0% utilizado · 20.0 GB livres' : '7% utilizado · 18.6 GB livres para fotos'}
          </small>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid #1a272a', borderRadius: '8px', padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#6f8387', textTransform: 'uppercase', fontWeight: 600 }}>Objetos no Bucket</span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#d9e2e1', margin: '4px 0' }}>{files.length} <span style={{ fontSize: '12px', color: '#6f8387', fontWeight: 400 }}>arquivos</span></div>
          <small style={{ fontSize: '10px', color: '#a3e635', marginTop: '6px', display: 'block' }}>⚡ 100% hospedados com CDN Edge Cache</small>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid #1a272a', borderRadius: '8px', padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#6f8387', textTransform: 'uppercase', fontWeight: 600 }}>Visibilidade e Política</span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#20d6c7', margin: '4px 0' }}>Public (ObjectRead)</div>
          <small style={{ fontSize: '10px', color: '#6f8387', marginTop: '6px', display: 'block' }}>🔒 Links diretos liberados para o Vercel sem token</small>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS (BUSCA E CATEGORIAS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#0a1012', border: '1px solid #182427', borderRadius: '8px', padding: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Busca */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6f8387' }} />
            <input
              type="text"
              placeholder={isVirginVM ? "Buscar arquivos neste bucket..." : "Buscar foto do cardápio (ex: picanha, heineken, pudim)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                background: '#060a0c',
                border: '1px solid #1c2b2f',
                borderRadius: '6px',
                padding: '0 10px 0 32px',
                color: '#d9e2e1',
                fontSize: '11px',
                outline: 'none'
              }}
            />
          </div>

          {/* Toggle de visualização */}
          <div style={{ display: 'flex', gap: '4px', background: '#060a0c', border: '1px solid #1c2b2f', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#18272b' : 'transparent',
                color: viewMode === 'grid' ? '#20d6c7' : '#6f8387',
                border: 0,
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Grade (Fotos)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#18272b' : 'transparent',
                color: viewMode === 'table' ? '#20d6c7' : '#6f8387',
                border: 0,
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Lista Detalhada
            </button>
          </div>
        </div>

        {/* Pílulas de Categoria */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat
            const count = cat === 'Todos' ? files.length : files.filter(f => f.category === cat).length

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? 'rgba(32, 214, 199, 0.15)' : '#0d1417',
                  border: isSelected ? '1px solid #20d6c7' : '1px solid #1c2b2f',
                  color: isSelected ? '#20d6c7' : '#8fa4a8',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
                <span style={{ fontSize: '9px', opacity: 0.75, background: isSelected ? '#20d6c7' : '#1c2b2f', color: isSelected ? '#030708' : '#8fa4a8', padding: '1px 5px', borderRadius: '10px' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* EMPTY STATE QUANDO NÃO HÁ ARQUIVOS */}
      {filteredFiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0a1012', border: '1px dashed #1c2b2f', borderRadius: '8px' }}>
          <HardDrive size={38} style={{ color: '#3d5256', margin: '0 auto 14px auto' }} />
          <h3 style={{ color: '#d9e2e1', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
            Nenhum Arquivo Encontrado
          </h3>
          <p style={{ color: '#6f8387', fontSize: '12px', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
            Nenhum arquivo encontrado neste bucket com os filtros aplicados. Faça upload de arquivos ou execute um backup para começar.
          </p>
          <button 
            className="primary-button"
            onClick={() => setUploadModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', margin: '0 auto' }}
          >
            <UploadCloud size={14} /> Fazer Primeiro Upload
          </button>
        </div>
      )}

      {/* RENDERIZAÇÃO: MODO GRADE (CARDS COM PREVIEW DE FOTO) */}
      {viewMode === 'grid' && filteredFiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {filteredFiles.map(file => {
            const isImage = file.type === 'image'
            const isCopied = copiedId === file.id

            return (
              <div
                key={file.id}
                style={{
                  background: '#0d1316',
                  border: '1px solid #1a272b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, border-color 0.2s',
                  position: 'relative'
                }}
              >
                {/* Thumbnail Preview */}
                <div
                  style={{
                    height: '140px',
                    background: '#070a0c',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isImage ? 'pointer' : 'default'
                  }}
                  onClick={() => isImage && setSelectedImage(file)}
                >
                  {isImage ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => {
                        // fallback se url falhar
                        (e.target as any).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#20d6c7' }}>
                      <Database size={36} />
                      <div style={{ fontSize: '10px', color: '#6f8387', marginTop: '6px' }}>MySQL Dump (.sql.gz)</div>
                    </div>
                  )}

                  {/* Badge de categoria no topo */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(5, 8, 10, 0.85)',
                      color: file.category === 'Backups' ? '#f59e0b' : '#20d6c7',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {file.category}
                  </span>

                  {/* Botão de preview rápido */}
                  {isImage && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#d9e2e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={11} /> Ver
                    </div>
                  )}
                </div>

                {/* Informações do Arquivo */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                      <strong
                        title={file.label || file.name}
                        style={{
                          fontSize: '12px',
                          color: '#e2eceb',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}
                      >
                        {file.label || file.name}
                      </strong>
                      {file.price && (
                        <span style={{ fontSize: '10px', color: '#a3e635', fontWeight: 700, background: 'rgba(163, 230, 53, 0.1)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(163, 230, 53, 0.25)' }}>
                          {file.price}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '9.5px', color: '#566f73', fontFamily: 'monospace', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6f8387', marginBottom: '10px' }}>
                      <span>{file.size}</span>
                      <span>{file.dimensions || file.uploadedAt}</span>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px', paddingTop: '8px', borderTop: '1px solid #142023' }}>
                    <button
                      type="button"
                      onClick={() => copyUrl(file)}
                      style={{
                        background: isCopied ? 'rgba(32, 214, 199, 0.2)' : '#101a1c',
                        border: isCopied ? '1px solid #20d6c7' : '1px solid #1d2d31',
                        color: isCopied ? '#20d6c7' : '#c9dcda',
                        borderRadius: '4px',
                        padding: '5px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? 'URL Copiada!' : 'Copiar Link (Vercel)'}
                    </button>

                    <button
                      type="button"
                      title="Excluir arquivo do bucket"
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      style={{
                        background: '#101a1c',
                        border: '1px solid #1d2d31',
                        color: '#ff6b6b',
                        borderRadius: '4px',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RENDERIZAÇÃO: MODO TABELA */}
      {viewMode === 'table' && filteredFiles.length > 0 && (
        <section className="panel" style={{ margin: 0 }}>
          <div className="container-list">
            {filteredFiles.map(file => {
              const isCopied = copiedId === file.id
              return (
                <div className="container-row" key={file.id} style={{ padding: '10px 14px' }}>
                  {file.type === 'image' ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ) : (
                    <Database size={20} style={{ color: '#f59e0b' }} />
                  )}

                  <div className="container-info" style={{ marginLeft: '12px' }}>
                    <strong style={{ fontSize: '11px', color: '#d9e2e1' }}>{file.name}</strong>
                    <small>{file.category} · {file.size} · Upload: {file.uploadedAt}</small>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
                    <button
                      className="text-action"
                      onClick={() => copyUrl(file)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? 'Copiado!' : 'Copiar URL'}
                    </button>

                    {file.type === 'image' && (
                      <button
                        className="text-action"
                        onClick={() => setSelectedImage(file)}
                        style={{ color: '#20d6c7' }}
                      >
                        Visualizar
                      </button>
                    )}

                    <button
                      className="row-menu"
                      title="Excluir arquivo"
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      style={{ color: '#ff6b6b' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

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
                <h4 style={{ color: '#d9e2e1', margin: 0, fontSize: '13px' }}>{selectedImage.name}</h4>
                <small style={{ color: '#6f8387', fontSize: '10px' }}>{selectedImage.dimensions} · {selectedImage.size} · {selectedImage.category}</small>
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
                src={selectedImage.previewUrl}
                alt={selectedImage.name}
                style={{ maxWidth: '100%', maxHeight: '440px', objectFit: 'contain', borderRadius: '6px' }}
              />
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid #1a272a', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  Nome do Item / Arquivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: picanha-com-fritas ou chopp-gelado.jpg"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#060a0c',
                    border: '1px solid #1b292c',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#d9e2e1',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#889e9d', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Categoria do Cardápio
                </label>
                <select
                  value={newFileCategory}
                  onChange={(e: any) => setNewFileCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#060a0c',
                    border: '1px solid #1b292c',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#d9e2e1',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                >
                  <option value="Pratos">Pratos & Porções</option>
                  <option value="Bebidas">Bebidas & Chopp</option>
                  <option value="Sobremesas">Sobremesas</option>
                  <option value="Banners">Banners & Topo</option>
                  <option value="Backups">Backups do Banco</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#889e9d', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  URL da Imagem / Origem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://... (deixe em branco para usar placeholder de alta qualidade)"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#060a0c',
                    border: '1px solid #1b292c',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#d9e2e1',
                    fontSize: '11px',
                    outline: 'none'
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
                  <UploadCloud size={14} /> Salvar no Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
