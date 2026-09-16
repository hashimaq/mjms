/**
 * Runs before React hydration to prevent dark-mode flash and enforce light as default
 * when no preference is stored yet.
 */
export function ThemeScript() {
  const script = `(function(){try{var k='mjms-theme';var t=localStorage.getItem(k);if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark');if(!t)localStorage.setItem(k,'light')}}catch(e){document.documentElement.classList.remove('dark')}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
