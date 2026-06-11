import { loadCourse } from '@/lib/course.mjs';
import WarmupPage from '@/components/WarmupPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  const course = loadCourse();
  // все квизы курса с привязкой к уроку — клиент отфильтрует по пройденным
  const quizzes = [];
  for (const m of course.modules) {
    for (const l of m.lessons) {
      l.screens.forEach((s) => {
        if (s.type === 'quiz') {
          quizzes.push({
            lessonId: l.id,
            lessonTitle: l.title,
            question: s.question,
            options: s.options,
            after: s.after,
          });
        }
      });
    }
  }
  return <WarmupPage quizzes={quizzes} />;
}
