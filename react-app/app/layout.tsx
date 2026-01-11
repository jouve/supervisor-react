import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Supervisor Status",
  description: "Supervisor Status",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
