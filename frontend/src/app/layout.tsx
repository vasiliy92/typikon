import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Typikon — Orthodox Liturgical Service Generator',
  description: 'Assemble complete Orthodox Christian liturgical services according to the Typikon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link href="/fonts/csy-fonts.css" rel="stylesheet" />
      </head>
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}