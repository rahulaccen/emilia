import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Emilia — LinkedIn Reshare Writer',
  description: 'Paste a LinkedIn post and get a personalised thought to share when reposting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
