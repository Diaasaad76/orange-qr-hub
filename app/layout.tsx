import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orange QR & MSurvey Generator",
  description: "Generate styled Orange Egypt QR codes, MSurvey links, and PowerPoint presentations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md px-6 py-3.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6600] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                O
              </div>
              <div>
                <span className="font-bold text-gray-900 tracking-tight text-base">Orange Egypt</span>
                <span className="text-gray-400 text-xs ml-2">QR & MSurvey Hub</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#FF6600] border border-orange-200">
                L&D Online
              </span>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
