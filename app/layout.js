import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LexiBuild | Smart Vocabulary Builder",
  description: "Extract and learn vocabulary from your reading material",
  icons: {
    icon: 'https://cdn-icons-png.flaticon.com/512/3308/3308312.png', // Temporary book icon URL
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
