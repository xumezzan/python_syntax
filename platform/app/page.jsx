import { loadCourse } from '@/lib/course.mjs';
import CourseMap from '@/components/CourseMap';

export const dynamic = 'force-dynamic';

export default function Home() {
  const course = loadCourse();
  // на карту отправляем только сводку, без содержимого экранов
  const modules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    goal: m.goal,
    lessons: m.lessons.map((l) => ({
      module: l.module,
      num: l.num,
      id: l.id,
      title: l.title,
      isBoss: l.isBoss,
      xp: l.xp,
      screens: l.screens.length,
    })),
  }));
  return <CourseMap modules={modules} />;
}
