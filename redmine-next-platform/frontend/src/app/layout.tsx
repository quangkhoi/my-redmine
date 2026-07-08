import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import messages from "@/messages/en.json";

export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers locale="en" messages={messages}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
