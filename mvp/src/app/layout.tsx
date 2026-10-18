import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/locale-provider";
import "./talkfeedback.css";
import { WorkshopShell } from "@/components/workshop-shell";

export const metadata: Metadata = {
  title: "Talk Feedback | Packt Workshop",
  description: "Share feedback on a talk and explore the audience's ratings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-US"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><LocaleProvider><WorkshopShell>{children}</WorkshopShell></LocaleProvider></body>
    </html>
  );
}
