export const metadata = {
  title: 'BR Esports Arena',
  description: 'Free Fire Tournament Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-white">{children}</body>
    </html>
  );
}
