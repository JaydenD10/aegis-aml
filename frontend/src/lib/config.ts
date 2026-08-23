const rawBackendUrl = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://aegis-aml.onrender.com'

export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '')

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_URL}${cleanPath}`
}
