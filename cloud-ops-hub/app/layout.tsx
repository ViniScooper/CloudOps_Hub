import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://cloudops-hub-dun.vercel.app'),
  title: {
    default: 'CloudOps Hub — Plataforma de Gestão Cloud, Docker & Oracle DB',
    template: '%s | CloudOps Hub',
  },
  description: 'Painel unificado de observabilidade SRE, contêineres Docker e bancos de dados Oracle 23ai & MySQL na Oracle Cloud (OCI). Blindado por Cloudflare Zero Trust com Nota A+ no SecurityHeaders.',
  keywords: [
    'CloudOps Hub',
    'José Vinícius Lourenço Marques de Sousa',
    'Vinícius Lourenço',
    'ViniScooper',
    'Painel DevOps',
    'Gerenciador de Servidores Cloud',
    'Oracle Cloud Always Free Dashboard',
    'Gerenciador Docker Web',
    'Observabilidade SRE',
    'Alternativa ao Portainer e Coolify',
    'Cloudflare Zero Trust Tunnel',
    'Oracle Database 23ai Docker',
    'Oracle RMAN Backup PITR',
    'Security Headers Grade A+',
    'Cofre OCI Vault AES-256',
    'SOC 2 Compliance Cloud'
  ],
  authors: [
    {
      name: 'José Vinícius Lourenço Marques de Sousa (Vinícius Lourenço)',
      url: 'https://github.com/ViniScooper',
    },
  ],
  creator: 'José Vinícius Lourenço Marques de Sousa',
  publisher: 'CloudOps Hub',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'CloudOps Hub — Plataforma de Gestão Cloud, Docker & Oracle DB',
    description: 'A Nuvem sob o seu Comando Absoluto. Observabilidade SRE, Docker e Oracle Database 23ai blindados por Cloudflare Zero Trust e Vercel Edge.',
    url: 'https://cloudops-hub-dun.vercel.app/landing',
    siteName: 'CloudOps Hub',
    images: [
      {
        url: '/prints/01_dashboard_principal.png',
        width: 1200,
        height: 630,
        alt: 'CloudOps Hub Dashboard SRE',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CloudOps Hub — Gestão Cloud, Docker & Oracle Database',
    description: 'Observabilidade SRE, contêineres Docker e Oracle 23ai com Zero Trust e Grade A+ em segurança.',
    images: ['/prints/01_dashboard_principal.png'],
    creator: '@ViniScooper',
  },
  generator: 'CloudOps Hub',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CloudOps Hub',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#070b0e' },
    { media: '(prefers-color-scheme: dark)', color: '#070b0e' },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      'name': 'CloudOps Hub',
      'operatingSystem': 'Linux, Ubuntu, Docker, OCI',
      'applicationCategory': 'DeveloperApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'BRL',
      },
      'author': {
        '@type': 'Person',
        'name': 'José Vinícius Lourenço Marques de Sousa',
        'url': 'https://github.com/ViniScooper',
      },
      'description': 'Plataforma corporativa de observabilidade SRE, contêineres Docker e bancos de dados relacionais e autônomos na Oracle Cloud Infrastructure.',
      'url': 'https://cloudops-hub-dun.vercel.app/landing',
    },
    {
      '@type': 'Person',
      'name': 'José Vinícius Lourenço Marques de Sousa',
      'alternateName': 'Vinícius Lourenço',
      'url': 'https://github.com/ViniScooper',
      'jobTitle': 'Desenvolvedor Full-Stack & Arquiteto Cloud / DBA',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
