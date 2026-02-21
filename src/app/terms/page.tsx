export const metadata = {
  title: 'Terms of Service - Guardia',
  description: 'Terms of Service for Guardia Content Intelligence Agency',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Terms of Service</h1>
        <p className="text-[var(--text-secondary)] mb-12">Last updated: December 23, 2024</p>

        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Services</h2>
            <p>Guardia provides AI-powered social media content creation and management services. Our service tiers (Spark, Pro, Unleashed) include varying levels of content creation, styled images, and engagement management as described on our pricing page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. Revisions</h2>
            <p>Each deliverable includes up to <strong className="text-[var(--text-primary)]">2 revisions</strong> at no additional cost. Additional revisions beyond this limit may incur extra fees or require a tier upgrade. Revision requests must be submitted within 7 days of delivery.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. Billing & Payments</h2>
            <p>Subscriptions are billed monthly in advance via Stripe. Your subscription will automatically renew unless cancelled. All payments are non-refundable except as required by law or at our sole discretion.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. Cancellation</h2>
            <p>You may cancel your subscription at any time through your billing portal or by contacting us. Cancellation takes effect at the end of your current billing period. You will continue to receive services until that date. No partial refunds are provided for unused portions of a billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Content Ownership</h2>
            <p>You retain ownership of all original materials you provide (logos, photos, brand assets). Once payment is received, you own all content we create for you. We may use anonymized examples of our work in our portfolio unless you request otherwise.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">6. Content Guidelines</h2>
            <p>We reserve the right to decline creating content that is illegal, defamatory, hateful, or violates platform terms of service. We are not responsible for content performance or engagement metrics, which depend on many factors outside our control.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">7. Service Availability</h2>
            <p>We aim for consistent, reliable service but do not guarantee uninterrupted availability. Scheduled maintenance or unforeseen issues may occasionally affect delivery timelines. We will communicate proactively about any significant delays.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">8. Limitation of Liability</h2>
            <p>Guardia&apos;s liability is limited to the amount you paid for services in the current billing period. We are not liable for indirect, incidental, or consequential damages arising from use of our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of our services after changes constitutes acceptance. We will notify active subscribers of material changes via email.</p>
          </section>

          <section className="pt-8 border-t border-[var(--border)]">
            <p className="text-[var(--text-muted)] text-sm">
              Questions? Contact us at{' '}
              <a href="mailto:hello@guardiacontent.com" className="text-[#C9A227] hover:underline">
                hello@guardiacontent.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
