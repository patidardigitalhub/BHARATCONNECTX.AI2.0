const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bcx_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data;
}

async function authRequest(path: string, method: 'GET' | 'POST', body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data;
}

export const api = {
  requestOtp: (phone: string) => request('/auth/otp/request', { phone }),
  verifyOtp: (phone: string, otp: string) => request('/auth/otp/verify', { phone, otp }),
  onboardBusiness: (payload: {
    name: string;
    category: string;
    whatsappNumber: string;
    ownerPhone: string;
  }) => request('/business/onboard', payload),

  // Connect CRM (Milestone 2)
  listCustomers: (params?: { search?: string; tag?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return authRequest(`/customers${qs ? `?${qs}` : ''}`, 'GET');
  },
  getCustomer: (id: string) => authRequest(`/customers/${id}`, 'GET'),
  createCustomer: (payload: { name?: string; phone: string }) =>
    authRequest('/customers', 'POST', payload),
  updateCustomerTags: (id: string, payload: { add: string[]; remove: string[] }) =>
    authRequest(`/customers/${id}/tags`, 'POST', payload),
  listCustomFields: () => authRequest('/custom-fields', 'GET'),
  createCustomField: (payload: { fieldName: string; fieldType: string }) =>
    authRequest('/custom-fields', 'POST', payload),

  // Connect Analytics (Milestone 6)
  getAnalyticsOverview: (days = 30) => authRequest(`/analytics/overview?days=${days}`, 'GET'),
};
