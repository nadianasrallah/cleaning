import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CompanyBranding {
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  metaTitle: string | null
  metaDescription: string | null
}

interface CompanyInfo {
  id: string
  name: string
  slug: string | null
  email: string | null
  phone: string | null
}

interface BrandingContextType {
  company: CompanyInfo | null
  branding: CompanyBranding | null
  isLoading: boolean
  loadBrandingBySlug: (slug: string) => Promise<void>
  loadBrandingByDomain: (domain: string) => Promise<void>
}

const defaultBranding: CompanyBranding = {
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  metaTitle: null,
  metaDescription: null
}

const BrandingContext = createContext<BrandingContextType>({
  company: null,
  branding: null,
  isLoading: false,
  loadBrandingBySlug: async () => {},
  loadBrandingByDomain: async () => {}
})

export function useBranding() {
  return useContext(BrandingContext)
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [branding, setBranding] = useState<CompanyBranding | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const host = window.location.hostname
    const isDefaultDomain = 
      host.includes('replit.dev') || 
      host.includes('localhost') || 
      host.includes('127.0.0.1')

    if (!isDefaultDomain) {
      loadBrandingByDomain(host)
    }
  }, [])

  useEffect(() => {
    if (branding) {
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor)
      document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor)
      document.documentElement.style.setProperty('--accent-color', branding.accentColor)
      document.documentElement.style.setProperty('--font-family', branding.fontFamily)

      if (branding.metaTitle) {
        document.title = branding.metaTitle
      }

      if (branding.faviconUrl) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = branding.faviconUrl
        document.getElementsByTagName('head')[0].appendChild(link)
      }

      if (branding.metaDescription) {
        let meta = document.querySelector("meta[name='description']") as HTMLMetaElement
        if (!meta) {
          meta = document.createElement('meta')
          meta.name = 'description'
          document.getElementsByTagName('head')[0].appendChild(meta)
        }
        meta.content = branding.metaDescription
      }
    }
  }, [branding])

  async function loadBrandingBySlug(slug: string) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/companies/by-slug/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setCompany(data.company)
        if (data.branding) {
          setBranding({
            ...defaultBranding,
            ...data.branding
          })
        }
      }
    } catch (error) {
      console.error('Failed to load branding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadBrandingByDomain(domain: string) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/companies/by-domain/${domain}`)
      if (response.ok) {
        const data = await response.json()
        setCompany(data.company)
        if (data.branding) {
          setBranding({
            ...defaultBranding,
            ...data.branding
          })
        }
      }
    } catch (error) {
      console.error('Failed to load branding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BrandingContext.Provider value={{ company, branding, isLoading, loadBrandingBySlug, loadBrandingByDomain }}>
      {children}
    </BrandingContext.Provider>
  )
}
