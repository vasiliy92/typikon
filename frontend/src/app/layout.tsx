import type { Metadata } from 'next';
import '@/../public/styles/globals.css';

export const metadata: Metadata = {
  title: 'Typikon',
  description: 'Liturgical service texts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
