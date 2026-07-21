'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  tags: string[];
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-customer form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('bcx_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    load();
  }, []);

  async function load(searchValue?: string) {
    setLoading(true);
    setError('');
    try {
      const data = await api.listCustomers(searchValue ? { search: searchValue } : undefined);
      setCustomers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    setError('');
    try {
      await api.createCustomer({ name: newName || undefined, phone: newPhone });
      setNewName('');
      setNewPhone('');
      setShowAdd(false);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 780, margin: '48px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Customers</h1>
          <p className="sub" style={{ marginBottom: 0 }}>Connect CRM — every customer across every channel.</p>
        </div>
        <button style={{ width: 'auto', margin: 0, padding: '10px 18px' }} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add customer'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ margin: '20px 0', maxWidth: '100%' }}>
          <label>Name (optional)</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} />
          <label>Phone</label>
          <input placeholder="+91XXXXXXXXXX" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <button onClick={handleAdd} disabled={!newPhone}>Create</button>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
        <input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          style={{ flex: 1 }}
        />
        <button style={{ width: 'auto', margin: 0, padding: '10px 18px' }} onClick={() => load(search)}>
          Search
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div style={{ marginTop: 24 }}>
        {loading ? (
          <p className="sub">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="sub">No customers yet.</p>
        ) : (
          customers.map((c) => (
            <a
              key={c.id}
              href={`/dashboard/customers/${c.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                border: '1px solid var(--line)',
                borderRadius: 8,
                marginBottom: 8,
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{c.name || 'Unnamed'}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{c.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {c.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)',
                      borderRadius: 20,
                      padding: '2px 10px',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
