import "./globals.css";
import ClientLayoutWrapper from "./components/ClientLayoutWrapper";

export const metadata = {
  title: "SchoolFlow - A Real-Time Educational Operations Platform",
  description: "Manage classes, teachers, and students in real time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
