import "./globals.css";

export const metadata = {
  title: "Tartan Tickets | Find your next campus thing",
  description: "Discover and book upcoming Carnegie Mellon student events.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
