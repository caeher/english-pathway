export const metadata = {
  title: 'FAQ — English Pathway',
}

const FAQ = [
  {
    q: 'Do I need to pay to use the platform?',
    a: 'No. You can start learning with the AI tutor for free. Creating an account is free and lets you manage your profile.',
  },
  {
    q: 'Can I use English Pathway on mobile?',
    a: 'Yes. The platform is responsive and you can install it as a PWA from your browser.',
  },
  {
    q: 'How does the AI tutor work?',
    a: 'The tutor guides you through lessons using voice or text, explains grammar on screen, and launches interactive activities when you are ready to practice.',
  },
  {
    q: 'Do I need an account to learn?',
    a: 'No. /learn is available without signing in. An account is only required for /settings.',
  },
]

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-black text-4xl text-(--text-primary) mb-8">Frequently asked questions</h1>
      <div className="space-y-4">
        {FAQ.map((item) => (
          <details key={item.q} className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 group">
            <summary className="font-display font-bold text-(--text-primary) cursor-pointer list-none flex justify-between items-center">
              {item.q}
              <span className="text-(--accent) group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-(--text-secondary) mt-3 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
