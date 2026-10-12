import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'SAI SMART CUSTOMER VAULT — SAI Tours & Travels',
  description:
    'AI-Powered Customer & Document Management System for SAI TOURS & TRAVELS (Madurai Head Office & Trichy Branch).',
  icons: {
    icon: '/branding/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 flex">
        <QueryProvider>
          <AuthProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              <Header />
              <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
