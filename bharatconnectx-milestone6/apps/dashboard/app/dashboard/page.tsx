'use client';

import { useEffect, useState } from 'react';

export default function DashboardHome() {
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bcx_token');
    if (!token) {
      window.location.href = '/login';
    } else {
      setHasToken(true);
    }
  }, []);

  if (!hasToken) return null;

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h1>You're logged in 🎉</h1>
      <p className="sub">
        Milestone 1 (auth + onboarding) is wired end-to-end.
      </p>
      <a className="link" href="/dashboard/customers">Go to Connect CRM →</a>
      <br />
      <a className="link" href="/dashboard/analytics">Go to Analytics →</a>
    </div>
  );
}
