'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

interface DailyRollup {
  date: string;
  newCustomers: number;
  appointmentsBooked: number;
  appointmentsCancelled: number;
  whatsappMessagesInbound: number;
  whatsappMessagesOutbound: number;
  campaignMessagesSent: number;
}

interface Overview {
  rangeDays: number;
  totals: Omit<DailyRollup, 'date'>;
  daily: DailyRollup[];
}

const METRICS: { key: keyof Omit<DailyRollup, 'date'>; label: string; color: string }[] = [
  { key: 'newCustomers', label: 'New customers', color: '#2ED9A6' },
  { key: 'appointmentsBooked', label: 'Appointments booked', color: '#8B7FE8' },
  { key: 'whatsappMessagesInbound', label: 'Inbound WhatsApp', color: '#E8A33D' },
];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('bcx_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    api
      .getAnalyticsOverview(30)
      .then(setOverview)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error" style={{ margin: 48, textAlign: 'center' }}>{error}</p>;
  if (!overview) return <p className="sub" style={{ margin: 48, textAlign: 'center' }}>Loading…</p>;

  const maxValue = Math.max(
    1,
    ...overview.daily.flatMap((d) => METRICS.map((m) => d[m.key])),
  );

  return (
    <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 20px' }}>
      <h1 style={{ marginBottom: 4 }}>Analytics</h1>
      <p className="sub">Last {overview.rangeDays} days — from the nightly rollup.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, margin: '28px 0' }}>
        {Object.entries(overview.totals).map(([key, value]) => (
          <div key={key} className="card" style={{ margin: 0, maxWidth: '100%', padding: '18px 20px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
            <div className="sub" style={{ margin: 0, fontSize: '0.8rem' }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
            </div>
          </div>
        ))}
      </div>

      {overview.daily.length === 0 ? (
        <p className="sub">
          No rollup data yet — the nightly job runs at 00:30, or trigger it manually with{' '}
          <code style={{ color: 'var(--accent)' }}>POST /analytics/rollup/run</code>.
        </p>
      ) : (
        <div className="card" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.82rem' }}>
            {METRICS.map((m) => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: m.color, display: 'inline-block' }} />
                {m.label}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
            {overview.daily.map((d) => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', flex: 1, gap: 2, height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: '100%' }}>
                  {METRICS.map((m) => (
                    <div
                      key={m.key}
                      title={`${m.label}: ${d[m.key]}`}
                      style={{
                        width: 5,
                        height: `${(d[m.key] / maxValue) * 100}%`,
                        background: m.color,
                        borderRadius: '2px 2px 0 0',
                        minHeight: d[m.key] > 0 ? 2 : 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            <span>{new Date(overview.daily[0].date).toLocaleDateString()}</span>
            <span>{new Date(overview.daily[overview.daily.length - 1].date).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
