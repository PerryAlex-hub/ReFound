import { StaticPage, InfoSection } from '@/components/layout/StaticPage';

export const metadata = { title: 'FAQs | ReFound' };

export default function FAQsPage() {
  return (
    <StaticPage title="FAQs">
      <InfoSection title="Why can't I see a photo of this found item?">
        <p>
          Phones, laptops, wallets, ID cards, and jewellery hide their photos from anyone browsing
          until a claim on that item is approved. It&apos;s the same reason listings are vague in
          general — a clear photo would let anyone claim it convincingly, owner or not.
        </p>
      </InfoSection>

      <InfoSection title="How does matching work?">
        <p>
          When you report something, ReFound automatically scores it against reports of the
          opposite type using category, how close the dates and locations are, and how similar the
          descriptions read. Likely matches show up as suggestions — acting on one still means
          filing a claim and passing the same verification as anyone else.
        </p>
      </InfoSection>

      <InfoSection title="What happens after I submit a claim?">
        <p>
          An administrator compares what you wrote against the finder&apos;s private verification
          answer. They can approve it, reject it, or ask you a follow-up question first. You&apos;ll
          see the outcome on your claim&apos;s page, and get contact details only if it&apos;s approved.
        </p>
      </InfoSection>

      <InfoSection title="Can more than one person claim the same item?">
        <p>
          Yes — several people may file a claim on the same found item. An administrator approves
          at most one, based on whose description best matches the finder&apos;s private answer.
        </p>
      </InfoSection>

      <InfoSection title="How long do reports stay active?">
        <p>
          90 days from when they&apos;re filed, unless something happens first (a match is confirmed,
          or you withdraw it). After that they expire automatically. File a new report if you&apos;re
          still looking.
        </p>
      </InfoSection>

      <InfoSection title="I found something that looks dangerous or illegal — what do I do?">
        <p>
          Don&apos;t report it through ReFound. Contact campus security directly — this platform is for
          ordinary lost property, not emergencies.
        </p>
      </InfoSection>

      <InfoSection title="I forgot my password">
        <p>
          Password reset isn&apos;t available yet. Contact your campus IT/helpdesk in the meantime —
          they can help directly.
        </p>
      </InfoSection>
    </StaticPage>
  );
}
