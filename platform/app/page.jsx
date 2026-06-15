import { loadCourse, trackModules, getTrack } from '@/lib/course.mjs';
import CourseMap from '@/components/CourseMap';

export const dynamic = 'force-dynamic';

const brief = (m) => ({
  id: m.id,
  track: m.track,
  trackNum: m.trackNum,
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
});

export default function Home() {
  const course = loadCourse();
  // на главной — только основной трек (синтаксис); остальные треки показываем
  // отдельной карточкой-баннером, чтобы не превращать главную в стену из 28 модулей.
  const modules = trackModules(course, 'syntax').map(brief);
  const backend = getTrack(course, 'backend');
  const backendModules = trackModules(course, 'backend');
  const otherTracks = backend
    ? [
        {
          slug: backend.slug,
          icon: backend.icon,
          title: backend.title,
          short: backend.short,
          modules: backendModules.length,
          lessons: backendModules.reduce((s, m) => s + m.lessons.length, 0),
        },
      ]
    : [];
  return <CourseMap modules={modules} otherTracks={otherTracks} />;
}
