'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';

interface CustomerProfile {
  id: string;
  name: string | null;
  phone: string;
  source: string | null;
  createdAt: string;
  tags: string[];
  interactions: any[];
}

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('bcx_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      const data = await api.getCustomer(params.id);
      setCustomer(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function addTag() {
    if (!newTag) return;
    try {
      await api.updateCustomerTags(params.id, { add: [newTag], remove: [] });
      setNewTag('');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function removeTag(tag: string) {
    try {
      await api.updateCustomerTags(params.id, { add: [], remove: [tag] });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (error) return <p className="error" style={{ margin: 48, textAlign: 'center' }}>{error}</p>;
  if (!customer) return <p className="sub" style={{ margin: 48, textAlign: 'center' }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 620, margin: '48px auto', padding: '0 20px' }}>
      <a href="/dashboard/customers" className="link" style={{ marginBottom: 20, display: 'inline-block' }}>
        ← Back to customers
      </a>

      <div className="card" style={{ maxWidth: '100%' }}>
        <h1>{customer.name || 'Unnamed customer'}</h1>
        <p className="sub">{customer.phone}</p>

        <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 20 }}>
          <div><b style={{ color: 'var(--text)' }}>Source</b><br />{customer.source ?? '—'}</div>
          <div><b style={{ color: 'var(--text)' }}>Added</b><br />{new Date(customer.createdAt).toLocaleDateString()}</div>
        </div>

        <label>Tags</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {customer.tags.length === 0 && <span className="sub" style={{ margin: 0 }}>No tags yet</span>}
          {customer.tags.map((t) => (
            <span
              key={t}
              onClick={() => removeTag(t)}
              title="Click to remove"
              style={{
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 20,
                padding: '3px 12px',
              }}
            >
              {t} ×
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="New tag name"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <button style={{ width: 'auto', margin: 0, padding: '10px 18px' }} onClick={addTag}>
            Add
          </button>
        </div>

        <div style={{ marginTop: 28, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <label style={{ marginTop: 0 }}>Interaction history</label>
          {customer.interactions.length === 0 ? (
            <p className="sub" style={{ margin: 0 }}>
              No interactions yet — these log automatically once a message comes in through WhatsApp.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customer.interactions.map((i: any) => (
                <div
                  key={i.id}
                  style={{
                    fontSize: '0.85rem',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: i.direction === 'INBOUND' ? '#0E141C' : 'transparent',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginBottom: 4 }}>
                    {i.channel} · {i.direction} · {new Date(i.createdAt).toLocaleString()}
                  </div>
                  <div>{i.payload?.text ?? JSON.stringify(i.payload)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
