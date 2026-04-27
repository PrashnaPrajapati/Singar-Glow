import Link from "next/link";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

export default function SupportPageLayout({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <div className="min-h-screen bg-[#fff7fa] text-gray-800">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-1 flex justify-between items-center">
          <Link href="/home" className="scale-75 origin-left">
            <Logo />
          </Link>

          <nav className="flex items-center gap-6 text-sm font-bold">
            <Link href="/services" className="hover:text-pink-500">
              Services
            </Link>
            <Link href="/packages" className="hover:text-pink-500">
              Packages
            </Link>
            <Link href="/login" className="hover:text-pink-500">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-500">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-gray-600">
            {description}
          </p>
        </section>

        <section className="bg-white px-6 py-14">
          <div className="mx-auto max-w-6xl">{children}</div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
