import SupportPageLayout from "@/components/SupportPageLayout";

const policies = [
  {
    title: "Booking confirmation",
    text: "Your booking is confirmed after you select a service or package, complete the required details, and receive confirmation in the app.",
  },
  {
    title: "Rescheduling",
    text: "Please reschedule as early as possible so the service provider can adjust availability and prepare for the new time.",
  },
  {
    title: "Cancellations",
    text: "If you cancel a confirmed booking, 15% of the total booking amount will be deducted as a cancellation charge. Any refund will be calculated after this deduction.",
  },
  {
    title: "Home service charge",
    text: "If you choose home service, an extra 10% charge will be added to the total amount. Salon visit bookings do not include this extra charge.",
  },
  {
    title: "Arrival and readiness",
    text: "For salon visits, arrive on time. For home service, keep the service space ready before the provider arrives.",
  },
  {
    title: "Payments",
    text: "Payment status should be checked before the appointment. If payment fails, retry from the payment page or contact support.",
  },
  {
    title: "Service changes",
    text: "Price, duration, and availability can change based on selected service, package, provider, and appointment requirements.",
  },
];

export default function BookingPolicyPage() {
  return (
    <SupportPageLayout
      eyebrow="Guidelines"
      title="Booking Policy"
      description="Clear booking rules help every appointment run smoothly for customers, providers, and the Singar Glow team."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {policies.map((policy, index) => (
          <article
            key={policy.title}
            className="rounded-xl border border-pink-200 bg-white p-6 shadow-sm"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white">
              {index + 1}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              {policy.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {policy.text}
            </p>
          </article>
        ))}
      </div>
    </SupportPageLayout>
  );
}
