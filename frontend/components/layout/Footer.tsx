import Link from 'next/link';
import { Search } from 'lucide-react';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Browse Items', href: '/dashboard' },
      { label: 'Report Lost', href: '/items/new?type=lost' },
      { label: 'Report Found', href: '/items/new?type=found' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Campus Guidelines', href: '/support/guidelines' },
      { label: 'FAQs', href: '/support/faqs' },
      { label: 'Contact Security', href: '/support/contact-security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Use', href: '/legal/terms' },
      { label: 'Student Code', href: '/legal/student-code' },
    ],
  },
];

/** Dark footer shared by the marketing landing page and the authenticated app shell. */
export function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center">
              <Search size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-white">ReFound</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">
            Reuniting campus with what matters. ReFound uses smart matching logic to connect lost belongings with their owners.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-white text-sm font-bold mb-4">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} University ReFound System. All rights reserved.</p>
          <p>v1.0.2 · Made for Campus Life</p>
        </div>
      </div>
    </footer>
  );
}
