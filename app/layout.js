export const metadata = {
  title: 'BR Esports Arena',
  description: 'Free Fire Tournament Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
