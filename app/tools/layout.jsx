'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getToolIcon, categoryIcons, getToolTitleColor } from '../lib/toolIcons';

export default function ToolLayout({ children }) {
  const pathname = usePathname();
  const slug = pathname.split('/').pop();
  const isCategoryPage = Object.prototype.hasOwnProperty.call(categoryIcons, slug);
  const Icon = getToolIcon(slug);
  const titleColor = getToolTitleColor(pathname);

  useEffect(() => {
    if (isCategoryPage) return;
    const h1 = document.querySelector('h1');
    if (!h1 || h1.querySelector('svg[data-tool-icon]')) return;
    const iconMarkup = renderToStaticMarkup(
      <Icon data-tool-icon="true" width={28} height={28} strokeWidth={2} className={titleColor} style={{ display: 'inline-block', marginRight: 8, verticalAlign: '-6px' }} />
    );
    h1.innerHTML = iconMarkup + h1.innerHTML;
  }, [pathname, Icon, isCategoryPage, titleColor]);

  return <>{children}</>;
}
