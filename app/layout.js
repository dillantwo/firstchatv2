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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 防止用户缩放导致布局问题
  viewportFit: 'cover', // 适配有notch的设备
  minimumScale: 1, // 防止Chrome自动缩小
  targetDensityDpi: 'device-dpi', // 确保正确的像素密度
  interactiveWidget: 'resizes-content', // 新标准：处理虚拟键盘
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-[#292a2d]">
      <body className={`${inter.className} antialiased bg-[#292a2d]`} suppressHydrationWarning={true}>
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
