import { createContext, useContext, type ElementType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Building2,
  BusFront,
  Compass,
  FlaskConical,
  GraduationCap,
  Handshake,
  Heart,
  House,
  Laptop,
  Landmark,
  Lightbulb,
  Play,
  Ruler,
  School,
  ShieldCheck,
  Sprout,
  Target,
  Trophy,
  UserRound,
  Utensils,
} from 'lucide-react';
import { apiGetPublic } from '@/lib/api';
import { testimonials as defaultTestimonials } from '@/data/content';
import { mergeSiteContent, siteDefaults, type SitePageKey } from './defaults';

type SiteEditContextValue = {
  pageKey: SitePageKey;
  content: any;
  editMode: boolean;
  onEdit?: (path: string, kind: 'text' | 'image' | 'link', value: any) => void;
};

const SiteEditContext = createContext<SiteEditContextValue | null>(null);

export const getSitePath = (source: any, path: string) =>
  path.split('.').reduce((value: any, key) => {
    if (value == null) return undefined;
    return value[key];
  }, source);

export const setSitePath = (source: any, path: string, next: any) => {
  const keys = path.split('.');
  const root = Array.isArray(source) ? [...source] : { ...(source ?? {}) };
  let cursor: any = root;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const current = cursor[key];
    cursor[key] = Array.isArray(current)
      ? [...current]
      : current && typeof current === 'object'
        ? { ...current }
        : {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = next;
  return root;
};

export const SiteEditProvider = ({
  pageKey,
  content,
  editMode,
  onEdit,
  children,
}: {
  pageKey: SitePageKey;
  content: any;
  editMode: boolean;
  onEdit?: (path: string, kind: 'text' | 'image' | 'link', value: any) => void;
  children: ReactNode;
}) => (
  <SiteEditContext.Provider value={{ pageKey, content, editMode, onEdit }}>
    {children}
  </SiteEditContext.Provider>
);

export const useSiteEdit = () => useContext(SiteEditContext);

export const useSitePage = <T = any,>(pageKey: SitePageKey): T => {
  const edit = useSiteEdit();
  const editingThisPage = Boolean(edit?.editMode && edit.pageKey === pageKey);
  const query = useQuery({
    queryKey: ['site-content', pageKey],
    queryFn: async () => (await apiGetPublic<{ content: any }>(`/site-content/${pageKey}`)).data,
    staleTime: 5 * 60_000,
    enabled: !editingThisPage,
  });
  const defaults = siteDefaults[pageKey] ?? {};
  if (editingThisPage) return mergeSiteContent(defaults, edit!.content ?? {}) as T;
  return mergeSiteContent(defaults, query.data?.content ?? {}) as T;
};

export const useSiteGlobal = () => useSitePage<any>('global');

export const useSiteTestimonials = () => {
  const query = useQuery({
    queryKey: ['site-testimonials'],
    queryFn: async () => (await apiGetPublic<any[]>('/site-content/testimonials')).data,
    staleTime: 2 * 60_000,
  });
  if (query.data === undefined) {
    return defaultTestimonials.map((item) => ({
      id: item.id,
      name: item.name,
      role: item.role,
      quote: item.quote,
      rating: 5,
      photoUrl: null,
    }));
  }
  return query.data;
};

export const useSiteGallery = () => {
  const query = useQuery({
    queryKey: ['site-gallery'],
    queryFn: async () => (await apiGetPublic<any[]>('/site-content/gallery')).data,
    staleTime: 2 * 60_000,
  });
  return query.data ?? [];
};

export const useSiteLeadership = () => {
  const query = useQuery({
    queryKey: ['site-leadership'],
    queryFn: async () => (await apiGetPublic<any[]>('/site-content/leadership')).data,
    staleTime: 2 * 60_000,
  });
  return query.data ?? [];
};

export const useSitePageEdit = () => {
  const edit = useSiteEdit();
  return {
    editMode: Boolean(edit?.editMode),
    pageKey: edit?.pageKey,
    content: edit?.content,
    emit: (path: string, kind: 'text' | 'image' | 'link', value: any) => {
      if (!edit?.editMode) return;
      const prefix = `${edit.pageKey}.`;
      const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'site-edit', pageKey: edit.pageKey, path: relativePath, kind, value },
          window.location.origin,
        );
      } else {
        edit.onEdit?.(relativePath, kind, value);
      }
    },
  };
};

export const SiteText = ({
  path,
  value,
  as: Tag = 'span',
  className,
  multiline = false,
}: {
  path: string;
  value?: string | null;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
}) => {
  const edit = useSitePageEdit();
  const text = String(value ?? '');
  return (
    <Tag
      className={className}
      data-site-edit={edit.editMode ? path : undefined}
      title={edit.editMode ? `Edit ${path}` : undefined}
      onClick={
        edit.editMode
          ? (event: React.MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();
              edit.emit(path, 'text', text);
            }
          : undefined
      }
      style={edit.editMode ? { cursor: 'pointer', outline: '1px dashed rgba(11,107,58,.45)' } : undefined}
      data-multiline={multiline ? 'true' : undefined}
    >
      {text}
    </Tag>
  );
};

export const SiteImage = ({
  path,
  src,
  alt = '',
  className,
  loading = 'lazy',
}: {
  path: string;
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) => {
  const edit = useSitePageEdit();
  return (
    <img
      src={src || '/school.JPG'}
      alt={alt}
      loading={loading}
      className={className}
      data-site-edit={edit.editMode ? path : undefined}
      title={edit.editMode ? `Edit ${path}` : undefined}
      onClick={
        edit.editMode
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              edit.emit(path, 'image', src || '');
            }
          : undefined
      }
      style={edit.editMode ? { cursor: 'pointer', outline: '2px dashed rgba(11,107,58,.65)' } : undefined}
    />
  );
};

export const SiteLink = ({
  path,
  to,
  label,
  className,
  children,
}: {
  path: string;
  to: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}) => {
  const edit = useSitePageEdit();
  return (
    <Link
      to={to || '/'}
      className={className}
      data-site-edit={edit.editMode ? path : undefined}
      title={edit.editMode ? `Edit ${path}` : undefined}
      onClick={
        edit.editMode
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              edit.emit(path, 'link', { to, label: label ?? '' });
            }
          : undefined
      }
      style={edit.editMode ? { outline: '1px dashed rgba(11,107,58,.45)' } : undefined}
    >
      {children ?? label}
    </Link>
  );
};

const ICONS = {
  award: Award,
  book: BookOpen,
  building: Building2,
  bus: BusFront,
  compass: Compass,
  flask: FlaskConical,
  graduation: GraduationCap,
  handshake: Handshake,
  heart: Heart,
  house: House,
  laptop: Laptop,
  landmark: Landmark,
  lightbulb: Lightbulb,
  play: Play,
  ruler: Ruler,
  school: School,
  shield: ShieldCheck,
  sprout: Sprout,
  target: Target,
  trophy: Trophy,
  user: UserRound,
  utensils: Utensils,
} as const;

export const SiteIcon = ({
  name,
  size = 22,
  className,
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) => {
  const Icon = ICONS[(name ?? 'book') as keyof typeof ICONS] ?? BookOpen;
  return <Icon size={size} aria-hidden="true" className={className} />;
};
