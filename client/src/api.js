// client/src/api.js
const API_BASE = 'https://workout-scheduler-backend.onrender.com/api';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!res.ok) {
    throw new Error(payload?.error || res.statusText || 'Request failed');
  }

  return payload || {};
}

export function apiGet(path) {
  return apiRequest(path);
}

export function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function apiPut(path, body) {
  return apiRequest(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function apiDelete(path) {
  return apiRequest(path, { method: 'DELETE' });
}