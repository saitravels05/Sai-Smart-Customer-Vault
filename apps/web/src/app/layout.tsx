import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/context/auth-context';
import { LanguageProvider } from '@/context/language-context';
import { DashboardShell } from '@/components/layout/dashboard-shell';

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
            <LanguageProvider>
              <DashboardShell>{children}</DashboardShell>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
