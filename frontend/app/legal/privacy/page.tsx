import { StaticPage, NotYetPublished, InfoSection } from '@/components/layout/StaticPage';

export const metadata = { title: 'Privacy Policy | ReFound' };

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <InfoSection title="What ReFound actually does with your data, today">
        <p>
          Your name, email, phone number, and matric number are stored to run the platform:
          identifying you, releasing your contact details to a matched finder or owner after a
          claim is approved, and nothing else. A private &quot;verification answer&quot; you write for a
          found item is visible only to you and administrators — never to anyone browsing.
        </p>
      </InfoSection>
      <NotYetPublished what="A full privacy policy — covering data retention, third parties, and your rights under applicable law" />
    </StaticPage>
  );
}
