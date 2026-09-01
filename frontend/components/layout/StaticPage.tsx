import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { Footer } from './Footer';

/** Lightweight chrome for standalone info pages (support/legal) reachable while logged out. */
export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <div className="flex items-center justify-center gap-2 py-5">
        <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center">
          <Search size={15} className="text-white" />
        </div>
        <Link href="/" className="font-extrabold text-lg text-[#111827]">ReFound</Link>
      </div>

      <div className="flex-1 px-4 pb-16">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-7 md:p-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#111827] mb-6">
            <ArrowLeft size={15} /> Back to ReFound
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] mb-6">{title}</h1>
          <div className="flex flex-col gap-4 text-sm text-gray-600 leading-relaxed">{children}</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-[#111827]">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Honest placeholder for pages needing real institutional content this codebase doesn't have. */
export function NotYetPublished({ what }: { what: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <p className="text-sm font-bold text-amber-800 mb-1">Not published yet</p>
      <p className="text-sm text-amber-700 leading-relaxed">
        This is a template deployment of ReFound. {what} needs to be supplied by the hosting
        campus before this page goes live — it isn&apos;t something the app can generate on its own.
        If you administer this deployment, replace this page with your institution&apos;s real text.
      </p>
    </div>
  );
}
