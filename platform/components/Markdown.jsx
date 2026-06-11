'use client';

import { marked } from 'marked';
import { getProgress } from '@/lib/progress';
import { skinEmoji } from '@/lib/skins';

marked.setOptions({ gfm: true, breaks: false });

// Превращает реплики «🐍 Пай: …» в карточку-коллаут маскота
// (с выбранным скином). Чисто визуальная трансформация поверх HTML.
function enhanceHtml(html) {
  const emoji = skinEmoji(getProgress());
  return html.replace(
    /<p>🐍 Пай:\s*([\s\S]*?)<\/p>/g,
    `<div class="pai"><span class="pai-ava">${emoji}</span><div class="pai-body"><b>Пай</b><span>$1</span></div></div>`
  );
}

export default function Markdown({ md, inline = false, enhance = false }) {
  if (!md) return null;
  let html = inline ? marked.parseInline(md) : marked.parse(md);
  if (enhance && !inline) html = enhanceHtml(html);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}
