import { StaticPage, InfoSection } from '@/components/layout/StaticPage';

export const metadata = { title: 'Campus Guidelines | ReFound' };

export default function GuidelinesPage() {
  return (
    <StaticPage title="Campus Guidelines">
      <p>
        ReFound only works if reports and claims are honest. These are the rules the platform
        actually enforces, and why they exist.
      </p>

      <InfoSection title="Accounts are required to post">
        <p>
          The finder holds an item until handover, so they need to be reachable and accountable.
          Anonymous posting would break the return process entirely.
        </p>
      </InfoSection>

      <InfoSection title="Listings are deliberately vague">
        <p>
          A found phone, laptop, wallet, ID card, or piece of jewellery shows only a category,
          rough location, and date to anyone browsing — no photo, no distinguishing detail. That&apos;s
          what stops someone claiming it convincingly without actually owning it.
        </p>
      </InfoSection>

      <InfoSection title="The verification question exists for a reason">
        <p>
          When you report something found, you&apos;re asked to record one private detail only the
          real owner would know. Never share this with a browsing student — it&apos;s how an
          administrator can compare two independent accounts of the same item before releasing
          anyone&apos;s contact details.
        </p>
      </InfoSection>

      <InfoSection title="Contact details are only released after approval">
        <p>
          Neither party sees the other&apos;s email or phone number until an administrator has
          approved a claim. At that point both the finder and the claimant receive each other&apos;s
          details at once, so either side can arrange the handover.
        </p>
      </InfoSection>

      <InfoSection title="Every decision is logged">
        <p>
          Approvals, rejections, and requests for more information are all recorded with a reason.
          Claims are contestable, so that record needs to be permanent.
        </p>
      </InfoSection>

      <InfoSection title="Reports expire after 90 days">
        <p>
          A lost or found report with no activity for 90 days is automatically marked expired. If
          you&apos;re still missing something after that, file a fresh report.
        </p>
      </InfoSection>

      <InfoSection title="Report abuse when you see it">
        <p>
          Every item page has a &quot;Report an issue with this listing&quot; option. Use it for anything
          that looks fake, offensive, or unsafe — a moderator reviews every report.
        </p>
      </InfoSection>
    </StaticPage>
  );
}
