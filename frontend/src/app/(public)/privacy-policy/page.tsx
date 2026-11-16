import Breadcrumbs from '@/components/public/Breadcrumbs';

export const metadata = {
  title: 'Privacy Policy — Meghani Watch Co.',
  description: 'Privacy Policy and client data protection practices at Meghani Watch Co.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="py-8 border-b border-[#221F18]">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Legal & Data Governance
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#8E877A] mt-2">
          Effective Date: January 1, 2026 • Meghani Watch Co. Ahmedabad
        </p>
      </div>

      <div className="py-10 space-y-8 text-xs sm:text-sm text-[#A8A194] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            1. Our Commitment to Client Confidentiality
          </h2>
          <p>
            At Meghani Watch Co., we hold the confidentiality and privacy of our clientele in the highest regard. This policy outlines how we collect, handle, and safeguard personal information provided through our website, WhatsApp concierge channel, and in-store salon consultations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            2. Information We Collect
          </h2>
          <p>
            We collect only the information necessary to provide tailored timepiece consultation and fulfill warranty obligations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#C0B9AC]">
            <li>Contact details such as your name, phone number, and email address when scheduling private viewings or submitting watch inquiries.</li>
            <li>Timepiece preferences, desired models, budget parameters, and commemorative dates (e.g. wedding anniversaries).</li>
            <li>Purchase history, serial numbers, and warranty certificates for after-sales servicing.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            3. Use of WhatsApp Concierge
          </h2>
          <p>
            When utilizing our WhatsApp consultation feature, communications occur via WhatsApp&apos;s encrypted platform. We use these interactions solely to answer product queries, provide quotation details, and schedule boutique visits. We will never sell, rent, or lease your contact information to third-party telemarketers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            4. Data Security & Storage
          </h2>
          <p>
            All client data collected through digital forms is stored in secure, encrypted databases with restricted access granted only to authorized horological staff.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            5. Contact Us Regarding Your Data
          </h2>
          <p>
            Should you wish to review, update, or request deletion of your consultation records, please contact our data concierge at{' '}
            <a href="mailto:concierge@meghaniwatch.com" className="text-[#C9A04F] underline">
              concierge@meghaniwatch.com
            </a>{' '}
            or write to Meghani Watch Co., Cactus Park, 23, New Sama Rd, Vadodara, Gujarat 390008.
          </p>
        </section>
      </div>
    </div>
  );
}

