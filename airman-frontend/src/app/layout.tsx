import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'AIRMAN — Flight School Management Platform',
  description: 'Advanced Integrated Resource Management & Aviation Network',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="radar-grid min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111d35',
              border: '1px solid rgba(74,114,196,0.2)',
              color: '#f0f4ff',
              fontFamily: 'var(--font-body)',
            },
          }}
        />
      </body>
    </html>
  );
}
