import { StaticPage, NotYetPublished } from '@/components/layout/StaticPage';

export const metadata = { title: 'Contact Security | ReFound' };

export default function ContactSecurityPage() {
  return (
    <StaticPage title="Contact Security">
      <p>
        ReFound is for ordinary lost-and-found reports — it does not monitor for emergencies and
        nothing submitted here reaches campus security in real time.
      </p>
      <p>
        If you&apos;ve found something dangerous, suspect a crime, or need urgent help, contact your
        campus security office directly rather than using this app.
      </p>
      <NotYetPublished what="This deployment's real campus security contact details (phone line, email, or office location)" />
    </StaticPage>
  );
}
