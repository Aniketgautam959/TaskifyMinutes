import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "./context/ThemeProvider";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "TaskifyMinutes — turn a call into minutes",
  description:
    "Turn a call into minutes. The decision, the open task, and who spoke stay on the same page for the next call. Hindi and Hinglish come back in English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} ${playfair.variable} antialiased bg-background text-foreground`}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            storageKey="taskify-theme"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
