import { StaticPage, NotYetPublished } from '@/components/layout/StaticPage';

export const metadata = { title: 'Student Code | ReFound' };

export default function StudentCodePage() {
  return (
    <StaticPage title="Student Code">
      <p>
        Filing a false claim on ReFound, or knowingly reporting a found item you intend to keep,
        is a form of dishonesty like any other — it may be handled under your institution&apos;s
        academic or student conduct code, not just by this app.
      </p>
      <NotYetPublished what="A link to (or excerpt from) this campus's actual student code of conduct" />
    </StaticPage>
  );
}
