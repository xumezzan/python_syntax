import { loadCourse } from '@/lib/course.mjs';
import ProfilePage from '@/components/ProfilePage';

export const dynamic = 'force-dynamic';

export default function Page() {
  const course = loadCourse();
  const modules = course.modules.map((m) => ({
    id: m.id,
    track: m.track,
    trackNum: m.trackNum,
    title: m.title,
    lessonIds: m.lessons.map((l) => l.id),
    totalScreens: m.lessons.reduce((s, l) => s + l.screens.length, 0),
  }));
  const tracks = course.tracks
    .filter((t) => modules.some((m) => m.track === t.slug))
    .map((t) => ({ slug: t.slug, title: t.title, home: t.home }));
  return <ProfilePage modules={modules} tracks={tracks} />;
}
