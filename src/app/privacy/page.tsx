export const metadata = {
  title: 'Privacy Policy - Guardia',
  description: 'Privacy Policy for Guardia Content Intelligence Agency',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-[var(--text-secondary)] mb-12">Last updated: February 28, 2026</p>

        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Overview</h2>
            <p>
              Guardia Content Intelligence Agency (&ldquo;Guardia,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), operated by Alejandro Moreno, provides
              a social media management service for local businesses. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when
              you use our service at guardiacontent.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Information We Collect</h2>

            <h3 className="text-lg font-medium text-[var(--text-primary)] mt-6 mb-2">Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Business name, contact email, and phone number</li>
              <li>Photos and images you upload for styling</li>
              <li>Brand preferences and style guidelines</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--text-primary)] mt-6 mb-2">Information from Connected Accounts</h3>
            <p>
              When you connect your social media accounts (Facebook, Instagram, YouTube),
              we receive access tokens that allow us to post content on your behalf. We collect:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Social media account IDs and page information</li>
              <li>Basic profile information from connected platforms</li>
              <li>Post performance metrics (likes, comments, reach)</li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--text-primary)] mt-6 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>IP address and browser type</li>
              <li>Usage data and interaction with our service</li>
              <li>Device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide our social media management services</li>
              <li>To create and publish content on your connected social media accounts</li>
              <li>To style and transform your uploaded images using AI</li>
              <li>To generate captions and hashtags for your posts</li>
              <li>To schedule and publish posts at optimal times</li>
              <li>To analyze post performance and provide insights</li>
              <li>To communicate with you about your account and services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To improve our services and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li><strong className="text-[var(--text-primary)]">Service Providers:</strong> Stripe (payments), Meta (Facebook/Instagram posting), Google (YouTube posting), AI providers for image styling</li>
              <li><strong className="text-[var(--text-primary)]">Social Media Platforms:</strong> Content you authorize us to post on your behalf</li>
              <li><strong className="text-[var(--text-primary)]">Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data from Facebook</h2>
            <p>
              When you connect your Facebook account, we request only the
              permissions necessary to provide our services:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li><strong className="text-[var(--text-primary)]">pages_manage_posts:</strong> To publish content to your Facebook Pages</li>
              <li><strong className="text-[var(--text-primary)]">pages_read_engagement:</strong> To show you how your posts perform (likes, comments, shares)</li>
              <li><strong className="text-[var(--text-primary)]">pages_show_list:</strong> To list your Facebook Pages for selection during setup</li>
            </ul>
            <p className="mt-4">
              We only access and store information necessary to provide our services.
              We never post without your authorization and you can revoke access at any time.
              You can also remove Guardia from your Facebook settings, which triggers
              automatic deletion of your connected account data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data from Instagram</h2>
            <p>
              When you connect your Facebook account and your Facebook Page has a linked
              Instagram Business account, we request the following Instagram permissions:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li><strong className="text-[var(--text-primary)]">instagram_basic:</strong> To read your Instagram Business account profile information (username, profile picture) and display it in your Account settings</li>
              <li><strong className="text-[var(--text-primary)]">instagram_content_publish:</strong> To publish photos to your Instagram Business account after you review and approve each post in the dashboard</li>
            </ul>
            <p className="mt-4">
              Instagram access is provided through your Facebook Page connection.
              We never post to Instagram without your explicit approval. You can
              disconnect Instagram at any time from your Account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to
              provide services. Uploaded images and generated content are retained until
              you request deletion or close your account. You can request data deletion
              at any time by visiting our{' '}
              <a href="/data-deletion" className="text-[#C9A227] hover:underline">Data Deletion page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect
              your data, including encryption in transit (HTTPS), secure token storage,
              and access controls. However, no method of transmission over the Internet
              is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Disconnect your social media accounts at any time</li>
              <li>Cancel your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for individuals under 18 years of age.
              We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you
              of any changes by posting the new Privacy Policy on this page and updating
              the &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-8">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:support@guardiacontent.com" className="text-[#C9A227] hover:underline">
                support@guardiacontent.com
              </a>
            </p>
            <p className="mt-4 text-[var(--text-muted)] text-sm">
              Guardia Content Intelligence Agency is operated by Alejandro Moreno.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
