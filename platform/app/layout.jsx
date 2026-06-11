import './globals.css';
import TopBar from '@/components/TopBar';

export const metadata = {
  title: 'PySyntax — Python-синтаксис с нуля',
  description: 'Интерактивная платформа: теория, код в браузере, подсказки и XP',
};

// применяем светлую тему до первой отрисовки — без вспышки
const themeScript = `try{var t=JSON.parse(localStorage.getItem('pysyntax-v1')||'{}').uiTheme;if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TopBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
