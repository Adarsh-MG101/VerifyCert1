import "./globals.css";
import { UIProvider } from "@/context/UIContext";

export const metadata = {
  title: "VerifyCert",
  description: "Secure Document Issuance & Verification",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  );
}
