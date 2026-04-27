import SupportPageLayout from "@/components/SupportPageLayout";

const faqs = [
  {
    question: "Can I view services without logging in?",
    answer:
      "Yes. You can browse services and packages first. Login is needed when you want to book, manage your profile, chat, or make payments.",
  },
  {
    question: "What is the difference between services and packages?",
    answer:
      "Services are individual beauty treatments. Packages combine multiple services together for a more complete experience.",
  },
  {
    question: "Can I book a home service?",
    answer:
      "Yes, where available. Choose your preferred service, then follow the booking flow to provide location and time details.",
  },
  {
    question: "What should I do if payment fails?",
    answer:
      "Check the payment status, make sure your details are correct, and try again. If it still fails, contact support before creating another booking.",
  },
  {
    question: "Can I change my appointment?",
    answer:
      "Appointment changes depend on provider availability. Please request changes as early as possible.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the Help Center for guidance, or contact Singar Glow through the phone and email details shown in the footer.",
  },
];

export default function FaqsPage() {
  return (
    <SupportPageLayout
      eyebrow="Answers"
      title="FAQs"
      description="Quick answers to common questions about browsing, booking, payments, services, packages, and account access."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {faqs.map((faq) => (
          <article
            key={faq.question}
            className="rounded-xl border border-pink-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {faq.question}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {faq.answer}
            </p>
          </article>
        ))}
      </div>
    </SupportPageLayout>
  );
}
