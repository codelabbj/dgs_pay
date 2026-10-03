// utils/auth.ts
// Simple authentication utility for handling JWT tokens

let refreshPromise: Promise<boolean> | null = null
let refreshTimeout: NodeJS.Timeout | null = null

// Token storage functions
export function getAccessToken(): string | null {
  return localStorage.getItem("access")
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh")
}

export function getTokenExp(): string | null {
  return localStorage.getItem("exp")
}

export function getUserData(): any {
  const userData = localStorage.getItem("user")
  return userData ? JSON.parse(userData) : null
}

// Store tokens and user data from login response
export function storeAuthData(response: any): void {
  
  localStorage.setItem("access", response.access)
  localStorage.setItem("refresh", response.refresh)
  localStorage.setItem("exp", response.exp)
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data))
  }
  
  
  // Dispatch custom event to notify components of auth state change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { isAuthenticated: true } 
    }))
  }
}

// Clear all auth data
export function clearAuthData(): void {
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
  localStorage.removeItem("exp")
  localStorage.removeItem("user")
  
  // Dispatch custom event to notify components of auth state change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { isAuthenticated: false } 
    }))
  }
}

// Check if access token is expired
export function isAccessTokenExpired(): boolean {
  const exp = getTokenExp()
  if (!exp) return true
  
  const expDate = new Date(exp)
  const now = new Date()
  
  // Consider expired 1 minute before actual expiration to be safe
  return expDate.getTime() - 60000 <= now.getTime()
}

// Check if refresh token is expired
export function isRefreshTokenExpired(): boolean {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return true
  
  try {
    // Decode JWT to check expiration
    const parts = refreshToken.split('.')
    if (parts.length !== 3) {
      console.error('Invalid refresh token format: not a valid JWT')
      return true
    }
    
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    
    
    return exp <= now
  } catch (error) {
    console.error('Error decoding refresh token:', error)
    return true
  }
}

// Check if user has any authentication data (for initial state check)
export function hasAuthData(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  const result = !!(accessToken && refreshToken)
  return result
}

// Validate token format and structure
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  
  // JWT tokens should have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  // Each part should be base64 encoded
  try {
    parts.forEach(part => {
      if (part) atob(part)
    })
    return true
  } catch {
    return false
  }
}

// Enhanced authentication check with token validation
export function isAuthenticated(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false
  }

  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  if (!accessToken || !refreshToken) return false
  
  // Validate token format
  if (!isValidTokenFormat(accessToken) || !isValidTokenFormat(refreshToken)) {
    // Clear invalid tokens
    clearAuthData()
    return false
  }
  
  // If refresh token is expired, user needs to login again
  if (isRefreshTokenExpired()) {
    clearAuthData()
    return false
  }
  
  // If access token is expired but refresh token is valid, we can refresh
  if (isAccessTokenExpired()) {
    // Trigger background refresh
    refreshAccessTokenInBackground()
    return true
  }
  
  return true
}

// More lenient authentication check for initial state
export function isAuthenticatedLenient(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false
  }

  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  // Just check if tokens exist, don't validate format or expiration
  const result = !!(accessToken && refreshToken)
  return result
}

// Refresh access token using refresh token
export async function refreshAccessTokenInBackground(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      console.error("No refresh token available for refresh attempt")
      return false
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!baseUrl) {
      console.error("Base URL not configured")
      return false
    }

    
    // Try the refresh endpoint - it might be at v1/api or api/v1
    let response = await fetch(`${baseUrl}/v1/api/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    

    // If 404, try alternative endpoint
    if (response.status === 404) {
      response = await fetch(`${baseUrl}/api/v1/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed with response:', errorText)
      
      // If refresh fails, clear auth data and redirect to login
      clearAuthData()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return false
    }

    const data = await response.json()
    
    // Store new tokens
    localStorage.setItem("access", data.access)
    localStorage.setItem("refresh", data.refresh)
    localStorage.setItem("exp", data.exp)
    
    // Schedule next refresh
    scheduleNextRefresh()
    
    return true
  } catch (error) {
    console.error("Token refresh failed with exception:", error)
    
    // If refresh fails, clear auth data and redirect to login
    clearAuthData()
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    
    return false
  }
}

// Schedule next token refresh
export function scheduleNextRefresh(): void {
  // Clear existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }

  const exp = getTokenExp()
  if (!exp) return

  const expDate = new Date(exp)
  const now = new Date()
  
  // Refresh 5 minutes before expiration
  const timeUntilRefresh = Math.max(0, expDate.getTime() - now.getTime() - 300000)
  
  if (timeUntilRefresh > 0) {
    refreshTimeout = setTimeout(() => {
      refreshAccessTokenInBackground()
    }, timeUntilRefresh)
  }
}

// Start background token refresh system
export function startBackgroundTokenRefresh(): void {
  if (!isAuthenticated()) return
  
  // Check if we need to refresh immediately
  if (isAccessTokenExpired()) {
    refreshAccessTokenInBackground()
  } else {
    // Schedule next refresh
    scheduleNextRefresh()
  }
}

// Stop background token refresh
export function stopBackgroundTokenRefresh(): void {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
  refreshPromise = null
}

// Smart fetch function that handles authentication automatically
export async function smartFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get current tokens
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  // If no tokens available, throw a clear error
  if (!accessToken || !refreshToken) {
    console.error('smartFetch: No tokens available', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      url 
    })
    throw new Error("No access token available")
  }
  
  // Check if we need to refresh token before making request
  if (isAccessTokenExpired() && !isRefreshTokenExpired()) {
    await refreshAccessTokenInBackground()
  }

  // Get the current access token (might have been refreshed)
  const currentAccessToken = getAccessToken()
  if (!currentAccessToken) {
    throw new Error("No access token available after refresh")
  }

  // Make request with access token
  // Don't set Content-Type for FormData uploads - let browser set it with proper boundary
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "Authorization": `Bearer ${currentAccessToken}`,
    ...options.headers,
  }


  const response = await fetch(url, {
    ...options,
    headers,
  })


  // 401 = token invalide/expiré → refresh.
  // 403 = permission métier (ex. compte pas encore vérifié/activé) → NE PAS refresh.
  if (response.status === 401) {
    const refreshTokenExpired = isRefreshTokenExpired()
    
    if (refreshTokenExpired) {
      // Clear auth data and redirect to login
      clearAuthData()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else {
      try {
        const refreshed = await refreshAccessTokenInBackground()
        
        if (refreshed) {
          // Wait a moment for the token to be stored
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const newAccessToken = getAccessToken()
          
          if (newAccessToken) {
            const retryHeaders = {
              ...(isFormData ? {} : { "Content-Type": "application/json" }),
              "Authorization": `Bearer ${newAccessToken}`,
              ...options.headers,
            }
            
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            })
            return retryResponse
          } else {
          }
        } else {
        }
      } catch (refreshError) {
        console.error('smartFetch: Error during token refresh:', refreshError)
      }
    }
  }

  return response
}

// Legacy function for backward compatibility
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return smartFetch(url, options)
}

// Debug function - call this from browser console to test token refresh
export async function debugTokenRefresh() {
  
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
    } catch (e) {
      console.error('Could not decode access token')
    }
  }
  
  if (refreshToken) {
    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]))
    } catch (e) {
      console.error('Could not decode refresh token')
    }
  }
  
  
  if (!isRefreshTokenExpired()) {
    const result = await refreshAccessTokenInBackground()
  } else {
  }
  
}

// Make it available on window for browser console access
if (typeof window !== 'undefined') {
  (window as any).__AUTH__ = {
    debugTokenRefresh,
    getAccessToken,
    getRefreshToken,
    isAccessTokenExpired,
    isRefreshTokenExpired,
    refreshAccessTokenInBackground,
  }
}

