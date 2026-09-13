import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Twiolo Dashboard | Secure GHL Call Gateway',
  description: 'Secure Call Agent Dashboard for HighLevel CRM with Twilio browser voice calling and zero customer phone number exposure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
