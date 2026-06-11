import { loadCourse } from '@/lib/course.mjs';
import ProfilePage from '@/components/ProfilePage';

export const dynamic = 'force-dynamic';

export default function Page() {
  const course = loadCourse();
  const modules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessonIds: m.lessons.map((l) => l.id),
    totalScreens: m.lessons.reduce((s, l) => s + l.screens.length, 0),
  }));
  return <ProfilePage modules={modules} />;
}
