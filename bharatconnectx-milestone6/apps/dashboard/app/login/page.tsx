'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp() {
    setError('');
    setLoading(true);
    try {
      await api.requestOtp(phone);
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setLoading(true);
    try {
      const { accessToken } = await api.verifyOtp(phone, otp);
      localStorage.setItem('bcx_token', accessToken);
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Log in</h1>
      <p className="sub">WhatsApp number as your identity — OTP login, no password.</p>

      {step === 'phone' ? (
        <>
          <label htmlFor="phone">WhatsApp number</label>
          <input
            id="phone"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={handleRequestOtp} disabled={loading || !phone}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <label htmlFor="otp">6-digit OTP</label>
          <input
            id="otp"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying…' : 'Verify & log in'}
          </button>
        </>
      )}

      {error && <p className="error">{error}</p>}
      <a className="link" href="/onboard">New business? Onboard here →</a>
    </div>
  );
}
