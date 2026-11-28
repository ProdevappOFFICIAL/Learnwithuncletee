import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { mergeSiteContent, siteDefaults, type SitePageKey } from '@/site/defaults';
import { SiteEditProvider } from '@/site/SiteContent';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { AcademicsPage } from '@/pages/AcademicsPage';
import { AdmissionsPage } from '@/pages/AdmissionsPage';
import { StudentLifePage } from '@/pages/StudentLifePage';
import { ServicesPage } from '@/pages/ServicesPage';
import { GalleryPage } from '@/pages/GalleryPage';
import { NewsPage } from '@/pages/NewsPage';
import { ContactPage } from '@/pages/ContactPage';

const PAGE_COMPONENTS: Record<SitePageKey, React.ComponentType> = {
  global: HomePage,
  home: HomePage,
  about: AboutPage,
  academics: AcademicsPage,
  admissions: AdmissionsPage,
  'student-life': StudentLifePage,
  services: ServicesPage,
  gallery: GalleryPage,
  news: NewsPage,
  contact: ContactPage,
};

export const SitePreviewPage = () => {
  const { pageKey = 'home' } = useParams<{ pageKey: SitePageKey }>();
  const key = (siteDefaults[pageKey as SitePageKey] ? pageKey : 'home') as SitePageKey;
  const [override, setOverride] = useState<any>({});
  const pageQuery = useQuery({
    queryKey: ['site-admin-page', key],
    queryFn: async () => (await apiGet<any>(`/site-content/admin/pages/${key}`)).data,
    staleTime: 0,
  });

  useEffect(() => {
    if (pageQuery.data) setOverride(pageQuery.data.draft ?? {});
  }, [pageQuery.data]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === 'site-draft' && data.pageKey === key) {
        setOverride(data.content ?? {});
      }
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: 'site-preview-ready', pageKey: key }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [key]);

  const content = useMemo(() => mergeSiteContent(siteDefaults[key] ?? {}, override), [key, override]);
  const Page = PAGE_COMPONENTS[key];

  const emitEdit = (path: string, kind: 'text' | 'image' | 'link', value: any) => {
    window.parent?.postMessage(
      { type: 'site-edit', pageKey: key, path, kind, value },
      window.location.origin,
    );
  };

  if (pageQuery.isPending) {
    return <div className="min-h-screen bg-white p-10 text-sm text-muted">Loading preview…</div>;
  }

  return (
    <SiteEditProvider pageKey={key} content={content} editMode onEdit={emitEdit}>
      <div
        onClickCapture={(event) => {
          // Editing a live page inside an iframe must never navigate away.
          if ((event.target as HTMLElement)?.closest('a')) event.preventDefault();
        }}
      >
        <Page />
      </div>
    </SiteEditProvider>
  );
};
