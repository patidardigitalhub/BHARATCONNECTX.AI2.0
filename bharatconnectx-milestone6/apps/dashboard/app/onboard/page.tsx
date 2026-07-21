'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

export default function OnboardPage() {
  const [form, setForm] = useState({
    name: '',
    category: '',
    whatsappNumber: '',
    ownerPhone: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await api.onboardBusiness(form);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card">
        <h1>Business created</h1>
        <p className="sub">Log in with the owner's WhatsApp number to reach the dashboard.</p>
        <a className="link" href="/login">Go to login →</a>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Onboard your business</h1>
      <p className="sub">Takes under a minute — one WhatsApp OTP and you're in.</p>

      <label>Business name</label>
      <input value={form.name} onChange={(e) => update('name', e.target.value)} />

      <label>Category</label>
      <input
        placeholder="e.g. Hospital, Salon, Restaurant"
        value={form.category}
        onChange={(e) => update('category', e.target.value)}
      />

      <label>Business WhatsApp number</label>
      <input
        placeholder="+91XXXXXXXXXX"
        value={form.whatsappNumber}
        onChange={(e) => update('whatsappNumber', e.target.value)}
      />

      <label>Owner's phone (for OTP login)</label>
      <input
        placeholder="+91XXXXXXXXXX"
        value={form.ownerPhone}
        onChange={(e) => update('ownerPhone', e.target.value)}
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creating…' : 'Create business'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
