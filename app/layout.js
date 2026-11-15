import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BR Esports Arena - Free Fire Tournaments",
  description: "Play Free Fire Solo Custom Room Tournaments and Win Real Cash!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <script
          type="text/javascript"
          src="https://embed.tawk.to/6af97899375b123c45407054/1k7f658b9"
          async
        ></script>
      </body>
    </html>
  );
}
