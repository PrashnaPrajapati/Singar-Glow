import Link from "next/link";
import SupportPageLayout from "@/components/SupportPageLayout";

const helpItems = [
  {
    title: "Booking support",
    text: "Get help choosing services, checking package details, and understanding how your appointment is confirmed.",
  },
  {
    title: "Account support",
    text: "Use login, signup, forgot password, and profile options to keep your account information up to date.",
  },
  {
    title: "Payment questions",
    text: "Review payment status, failed payment handling, and what to do before trying again.",
  },
  {
    title: "Feedback support",
    text: "After your booking is completed, you can share your rating and review from your dashboard. Your feedback helps other customers choose services and helps Singar Glow improve service quality.",
  },
];

export default function HelpCenterPage() {
  return (
    <SupportPageLayout
      eyebrow="Support"
      title="Help Center"
      description="Find quick answers and the right next step when you need help with Singar Glow services, packages, bookings, or your account."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {helpItems.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-pink-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">{item.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Need direct help?</h2>
        <p className="mt-3 text-gray-600">
          Contact our support team for booking changes, service questions, or
          account issues.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/services"
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm"
          >
            Browse Services
          </Link>
          <Link
            href="/faqs"
            className="rounded-full border border-pink-200 px-6 py-3 text-center text-sm font-semibold text-pink-500 hover:bg-pink-50"
          >
            Read FAQs
          </Link>
        </div>
      </div>
    </SupportPageLayout>
  );
}
