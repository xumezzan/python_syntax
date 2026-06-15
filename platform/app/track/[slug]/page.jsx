import { notFound } from 'next/navigation';
import { loadCourse, trackModules, getTrack } from '@/lib/course.mjs';
import { TRACK_INTRO } from '@/lib/tracks-intro';
import TrackPage from '@/components/TrackPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { slug } = await params;
  const course = loadCourse();
  const track = getTrack(course, slug);
  const intro = TRACK_INTRO[slug];
  if (!track || !intro) notFound();

  const modules = trackModules(course, slug).map((m) => ({
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
  }));

  return (
    <TrackPage
      track={{ slug: track.slug, icon: track.icon, title: track.title, short: track.short }}
      intro={intro}
      modules={modules}
    />
  );
}
