import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — HYRISE",
  description: "Get in touch with the HYRISE team for billing, refund, or feature questions.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Contact
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Get in touch</h1>
          <p className="mt-2 text-slate-600">
            Questions, feedback, or billing issues? We usually reply within 24 hours on business days.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Prefer email?{" "}
            <a href="mailto:support@swache.in" className="font-semibold text-brand-600 hover:underline">
              support@swache.in
            </a>
          </p>
        </div>

        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
