import { Inter } from "next/font/google";
import "./globals.css";
import "./prism.css";
import 'katex/dist/katex.min.css';
import { LTIAuthProvider } from "@/context/LTIAuthContext";
import { AppContextProvider } from "@/context/AppContextLTI";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "FirstChat",
  description: "QEF FirstChat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        <LTIAuthProvider>
          <AppContextProvider>
            <Toaster toastOptions={
              {
                success: {style: { background: "black", color: "white"}},
                error: {style: { background: "black", color: "white"}}
              }
            }/>
            {children}
          </AppContextProvider>
        </LTIAuthProvider>
      </body>
    </html>
  );
}
