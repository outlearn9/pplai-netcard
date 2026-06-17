const API = import.meta.env.VITE_API_URL || ''

export function getAuthHeaders() {
  const token = localStorage.getItem('netcard_jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {}),
  }
  return fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })
}
