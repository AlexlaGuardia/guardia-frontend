export const metadata = {
  title: 'Data Deletion - Guardia',
  description: 'How to request deletion of your data from Guardia',
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Data Deletion</h1>

        <div className="space-y-6 text-[var(--text-secondary)] leading-relaxed">
          <p>
            Guardia respects your privacy and your right to control your data.
            You can request deletion of your data at any time.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8">How to Request Data Deletion</h2>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 text-[#C9A227] rounded-full flex items-center justify-center font-semibold">1</span>
              <p>Email <a href="mailto:support@guardiacontent.com" className="text-[#C9A227] hover:underline">support@guardiacontent.com</a> with the subject line &ldquo;Data Deletion Request&rdquo;</p>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 text-[#C9A227] rounded-full flex items-center justify-center font-semibold">2</span>
              <p>Include the email address or business name associated with your Guardia account</p>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 text-[#C9A227] rounded-full flex items-center justify-center font-semibold">3</span>
              <p>We will process your request and confirm deletion within 30 days</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8">What Gets Deleted</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)]">
            <li>Your account information and business profile</li>
            <li>Uploaded images and generated content</li>
            <li>Scheduling history and analytics data</li>
            <li>Connected social media account tokens</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8">Disconnect via Facebook</h2>
          <p>
            You can also remove Guardia&apos;s access to your Facebook/Instagram directly:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-[var(--text-secondary)]">
            <li>Go to Facebook Settings</li>
            <li>Navigate to &ldquo;Apps and Websites&rdquo;</li>
            <li>Find Guardia and click &ldquo;Remove&rdquo;</li>
          </ol>
          <p className="text-sm text-[var(--text-muted)] mt-4">
            This will revoke our access but won&apos;t delete data already stored.
            For full deletion, please also email us.
          </p>

          <div className="border-t border-[var(--border)] pt-8 mt-8">
            <p className="text-sm text-[var(--text-muted)]">
              Questions? Contact us at{' '}
              <a href="mailto:support@guardiacontent.com" className="text-[#C9A227] hover:underline">
                support@guardiacontent.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
