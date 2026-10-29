import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LBD Caregiver Notebook",
  description: "Personal caregiver notebook for Lewy Body Dementia — check-ins, meds, and ER card.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}