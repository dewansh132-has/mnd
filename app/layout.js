import './globals.css';

export const metadata = {
  title: 'MND — Multilingual News Digest',
  description:
    'Stay updated with the latest news from across India. MND aggregates sports, education, technology, and politics news from trusted Indian sources.',
  keywords: 'India news, Indian news aggregator, sports, education, technology, politics, MND, Multilingual News Digest',
  openGraph: {
    title: 'MND — Multilingual News Digest',
    description: 'Your daily digest of Indian news across sports, education, technology, and politics.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
