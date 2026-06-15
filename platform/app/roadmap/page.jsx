import { loadCourse, trackModules, getTrack } from '@/lib/course.mjs';
import RoadmapPage from '@/components/RoadmapPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  const course = loadCourse();
  const tracks = course.tracks
    .filter((t) => trackModules(course, t.slug).length > 0)
    .map((t) => {
      const mods = trackModules(course, t.slug);
      return {
        slug: t.slug,
        icon: t.icon,
        title: t.title,
        short: t.short,
        modules: mods.length,
        href: t.home ? '/' : `/track/${t.slug}`,
        lessons: mods.flatMap((m) => m.lessons.map((l) => l.id)),
      };
    });
  return <RoadmapPage tracks={tracks} />;
}
