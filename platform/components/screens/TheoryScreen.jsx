'use client';

import Markdown from '@/components/Markdown';

export default function TheoryScreen({ screen }) {
  return (
    <article className="theory">
      <Markdown md={screen.md} enhance />
    </article>
  );
}
