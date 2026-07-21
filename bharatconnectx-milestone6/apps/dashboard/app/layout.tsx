import './globals.css';

export const metadata = {
  title: 'BharatConnectX.AI',
  description: 'WhatsApp-first Business OS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
