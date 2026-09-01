import { StaticPage, NotYetPublished } from '@/components/layout/StaticPage';

export const metadata = { title: 'Terms of Use | ReFound' };

export default function TermsOfUsePage() {
  return (
    <StaticPage title="Terms of Use">
      <p>
        By using ReFound you agree to report items honestly, only claim property that&apos;s actually
        yours, and not misuse the contact details released to you after an approved claim. See{' '}
        the{' '}
        <a href="/support/guidelines" className="font-semibold text-[#F97316] hover:opacity-80">
          Campus Guidelines
        </a>{' '}
        for how the platform enforces this.
      </p>
      <NotYetPublished what="Full terms of use — liability, account termination, and dispute handling" />
    </StaticPage>
  );
}
