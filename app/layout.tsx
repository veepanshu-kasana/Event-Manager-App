import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "VK Events - Event Management Platform",
    template: "%s | VK Events"
  },
  description: "Modern event management platform for creating, managing, and registering for events. Built by Veepanshu Kasana.",
  keywords: ["events", "event management", "registration", "VK Events", "Veepanshu Kasana"],
  authors: [{ name: "Veepanshu Kasana" }],
  creator: "Veepanshu Kasana",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    title: "VK Events - Event Management Platform",
    description: "Modern event management platform for creating, managing, and registering for events.",
    siteName: "VK Events",
  },
  twitter: {
    card: "summary_large_image",
    title: "VK Events - Event Management Platform",
    description: "Modern event management platform for creating, managing, and registering for events.",
    creator: "@veepanshukasana",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  let currentUser = null;
  if (authUser) {
    const { data: user } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', authUser.id)
      .single();
    currentUser = user;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar currentSession={authUser} currentUser={currentUser} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
