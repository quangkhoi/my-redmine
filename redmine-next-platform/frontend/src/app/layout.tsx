import "./globals.css";
import { Providers } from "./providers";
import messages from "@/messages/en.json";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers locale="en" messages={messages}>{children}</Providers>
      </body>
    </html>
  );
}
