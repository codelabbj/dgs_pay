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
  console.log('storeAuthData called with:', response)
  
  localStorage.setItem("access", response.access)
  localStorage.setItem("refresh", response.refresh)
  localStorage.setItem("exp", response.exp)
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data))
  }
  
  console.log('Auth data stored in localStorage:', {
    access: localStorage.getItem("access"),
    refresh: localStorage.getItem("refresh"),
    exp: localStorage.getItem("exp"),
    user: localStorage.getItem("user")
  })
  
  // Dispatch custom event to notify components of auth state change
  if (typeof window !== 'undefined') {
    console.log('Dispatching authStateChanged event')
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
    const payload = JSON.parse(atob(refreshToken.split('.')[1]))
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
  console.log('hasAuthData check:', { accessToken: !!accessToken, refreshToken: !!refreshToken, result })
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
  console.log('isAuthenticatedLenient check:', { accessToken: !!accessToken, refreshToken: !!refreshToken, result })
  return result
}

// Refresh access token using refresh token
export async function refreshAccessTokenInBackground(): Promise<boolean> {
  // Prevent multiple simultaneous refresh attempts
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new Error("No refresh token available")
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) {
        throw new Error("Base URL not configured")
      }

      const response = await fetch(`${baseUrl}/v1/api/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
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
      console.error("Token refresh failed:", error)
      
      // If refresh fails, clear auth data and redirect to login
      clearAuthData()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
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
    console.log('smartFetch: Access token expired, refreshing...')
    await refreshAccessTokenInBackground()
  }

  // Get the current access token (might have been refreshed)
  const currentAccessToken = getAccessToken()
  if (!currentAccessToken) {
    throw new Error("No access token available after refresh")
  }

  // Make request with access token
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${currentAccessToken}`,
    ...options.headers,
  }

  console.log('smartFetch: Making request with token', { url, hasToken: !!currentAccessToken })

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If we get 401, try to refresh token and retry once
  if (response.status === 401 && !isRefreshTokenExpired()) {
    console.log('smartFetch: Got 401, attempting token refresh...')
    const refreshed = await refreshAccessTokenInBackground()
    if (refreshed) {
      const newAccessToken = getAccessToken()
      if (newAccessToken) {
        const retryHeaders = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newAccessToken}`,
          ...options.headers,
        }
        
        console.log('smartFetch: Retrying request with new token')
        return fetch(url, {
          ...options,
          headers: retryHeaders,
        })
      }
    }
  }

  return response
}

// Legacy function for backward compatibility
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return smartFetch(url, options)
}
