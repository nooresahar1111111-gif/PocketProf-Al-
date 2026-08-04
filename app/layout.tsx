import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  title: "PocketProf AI",
  description: "24/7 Academic Companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#070b14] text-slate-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
