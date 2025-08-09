// utils/auth.ts
// Utility for handling access token refresh and authentication

export function getTokenExp() {
  const exp = localStorage.getItem("exp")
  if (!exp) return null
  return new Date(exp)
}

export function getAccessToken() {
  return localStorage.getItem("access")
}

export function getRefreshToken() {
  return localStorage.getItem("refresh")
}

export async function refreshAccessToken(baseUrl: string) {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const res = await fetch(`${baseUrl}/api/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem("access", data.access)
      localStorage.setItem("refresh", data.refresh)
      localStorage.setItem("exp", data.exp)
      return true
    } else {
      localStorage.removeItem("access")
      localStorage.removeItem("refresh")
      localStorage.removeItem("exp")
      localStorage.removeItem("user")
      return false
    }
  } catch {
    return false
  }
}

export async function ensureAuth(baseUrl: string, router: any) {
  const access = getAccessToken()
  const expDate = getTokenExp()
  const now = new Date()
  if (access && expDate && expDate > now) {
    // Access token is valid
    return true
  } else {
    // Try to refresh
    const refreshed = await refreshAccessToken(baseUrl)
    if (refreshed) {
      return true
    } else {
      router.replace("/login")
      return false
    }
  }
}

// Utility function for making authenticated API calls
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const accessToken = getAccessToken()
  
  if (!accessToken) {
    throw new Error("No access token available")
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If token is expired, try to refresh
  if (response.status === 401) {
    const refreshed = await refreshAccessToken(process.env.NEXT_PUBLIC_BASE_URL!)
    if (refreshed) {
      // Retry the request with new token
      const newAccessToken = getAccessToken()
      const retryHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newAccessToken}`,
        ...options.headers,
      }
      
      return fetch(url, {
        ...options,
        headers: retryHeaders,
      })
    } else {
      // Refresh failed, redirect to login
      window.location.href = "/login"
      throw new Error("Authentication failed")
    }
  }

  return response
}
