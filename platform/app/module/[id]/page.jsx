import { notFound } from 'next/navigation';
import { loadCourse, getModule } from '@/lib/course.mjs';
import ModulePage from '@/components/ModulePage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { id } = await params;
  const mod = getModule(loadCourse(), id);
  if (!mod) notFound();
  return <ModulePage mod={mod} />;
}
