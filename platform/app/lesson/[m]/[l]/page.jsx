import { notFound } from 'next/navigation';
import { loadCourse, getLesson } from '@/lib/course.mjs';
import LessonPlayer from '@/components/LessonPlayer';

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }) {
  const { m, l } = await params;
  const data = getLesson(loadCourse(), m, l);
  if (!data) notFound();
  return (
    <LessonPlayer
      lesson={data.lesson}
      moduleTitle={data.moduleTitle}
      prev={data.prev}
      next={data.next}
      moduleLessonIds={data.moduleLessonIds}
    />
  );
}
