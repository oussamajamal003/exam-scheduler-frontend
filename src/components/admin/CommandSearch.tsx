import React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  CornerDownLeft,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { normalizeCommandSearchText } from '@/lib/searchText';
import { useGlobalSearch } from '@/hooks/search/useGlobalSearch';
import { useValidateRecentItems } from '@/hooks/search/useValidateRecentItems';
import type {
  SearchGroup,
  SearchResult,
  SearchResultType,
} from '@/api/search.api';

const RECENT_KEY = 'admin-command-search-recent';
const MAX_RECENT = 6;

const iconForType: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  'admin-dashboard': ShieldCheck,
  semester: Calendar,
  course: GraduationCap,
  'course-offering': Layers,
  exam: ClipboardCheck,
  student: Users,
  'student-dashboard': ShieldCheck,
  proctor: UserCog,
  'proctor-dashboard': ShieldCheck,
  admin: ShieldCheck,
  program: GraduationCap,
  department: Building,
  room: Building2,
  center: Building,
  schedule: CalendarClock,
};

type QuickAction = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  keywords: string[];
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'generate-schedule',
    label: 'Generate Schedule',
    description: 'Launch the scheduling wizard',
    icon: Sparkles,
    href: '/scheduling?openGenerate=true',
    keywords: ['generate', 'schedule', 'run', 'create schedule'],
  },
  {
    id: 'create-room',
    label: 'Create Room',
    description: 'Add a new exam room',
    icon: Plus,
    href: '/rooms?new=1',
    keywords: ['create', 'room', 'add room', 'new room'],
  },
  {
    id: 'add-proctor',
    label: 'Add Proctor',
    description: 'Onboard a new proctor',
    icon: UserCog,
    href: '/proctors?new=1',
    keywords: ['add', 'proctor', 'invigilator', 'new proctor'],
  },
  {
    id: 'open-published',
    label: 'Open Published Schedule',
    description: 'Jump to published exam schedule',
    icon: CalendarClock,
    href: '/scheduling?tab=published',
    keywords: ['published', 'schedule', 'final'],
  },
];

type FlatItem =
  | { kind: 'action'; action: QuickAction }
  | { kind: 'result'; result: SearchResult; group: SearchGroup };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickActions?: QuickAction[];
  placeholder?: string;
  initialTitle?: string;
  initialDescription?: string;
  emptyDescription?: string;
  footerLabel?: string;
  recentStorageKey?: string;
};

const loadRecent = (storageKey: string): SearchResult[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SearchResult[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const pushRecent = (storageKey: string, result: SearchResult) => {
  try {
    const existing = loadRecent(storageKey);
    const dedup = [result, ...existing.filter((r) => r.id !== result.id || r.type !== result.type)];
    localStorage.setItem(storageKey, JSON.stringify(dedup.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
};

const matchesQuickAction = (action: QuickAction, query: string) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    action.label.toLowerCase().includes(q) ||
    action.description.toLowerCase().includes(q) ||
    action.keywords.some((k) => k.includes(q))
  );
};

const buildTargetWithParams = (pathname: string, params?: Record<string, string | null | undefined>) => {
  if (!params) return pathname;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const next = search.toString();
  return next ? `${pathname}?${next}` : pathname;
};

const resolveSearchTarget = (result: SearchResult) => {
  switch (result.type) {
    case 'admin-dashboard':
      return '/dashboard';
    case 'student-dashboard':
      return '/student/dashboard';
    case 'proctor-dashboard':
      return '/proctor/dashboard';
    case 'course-offering':
      return buildTargetWithParams('/course-offerings', {
        offeringId: result.id,
        semesterId: typeof result.metadata?.semesterId === 'string' ? result.metadata.semesterId : undefined,
        _hl: normalizeCommandSearchText(result.title),
      });
    case 'student':
      return result.href.startsWith('/proctor/')
        ? buildTargetWithParams('/proctor/students', { studentId: result.id, _hl: result.title })
        : buildTargetWithParams('/students', { studentId: result.id, _hl: result.title });
    case 'proctor':
      return buildTargetWithParams('/proctors', { proctorId: result.id, _hl: result.title });
    case 'schedule':
      if (result.href.startsWith('/student/')) {
        return buildTargetWithParams('/student/schedule', { scheduleId: result.id, _hl: normalizeCommandSearchText(result.title) });
      }
      if (result.href.startsWith('/proctor/')) {
        return buildTargetWithParams('/proctor/schedule', { scheduleId: result.id, _hl: normalizeCommandSearchText(result.title) });
      }
      return buildTargetWithParams('/scheduling', { scheduleId: result.id, view: 'table', _hl: normalizeCommandSearchText(result.title) });
    case 'course':
      if (result.href.startsWith('/student/')) {
        return buildTargetWithParams('/student/courses', { courseId: result.id, _hl: normalizeCommandSearchText(result.title) });
      }
      if (result.href.startsWith('/proctor/')) {
        return buildTargetWithParams('/proctor/schedule', { courseId: result.id, _hl: normalizeCommandSearchText(result.title) });
      }
      return buildTargetWithParams('/courses', { courseId: result.id, _hl: normalizeCommandSearchText(result.title) });
    case 'exam':
      if (result.href.startsWith('/student/')) {
        return buildTargetWithParams('/student/schedule', { examId: result.id, _hl: normalizeCommandSearchText(result.title) });
      }
      if (result.href.startsWith('/proctor/')) {
        return buildTargetWithParams('/proctor/schedule', { assignmentId: result.id, _hl: normalizeCommandSearchText(result.title) });
      }
      return buildTargetWithParams('/scheduling', { examId: result.id, view: 'table', _hl: normalizeCommandSearchText(result.title) });
    case 'room':
      if (result.href.startsWith('/student/')) {
        return buildTargetWithParams('/student/schedule', { roomId: result.id });
      }
      if (result.href.startsWith('/proctor/')) {
        return buildTargetWithParams('/proctor/schedule', { roomId: result.id });
      }
      return buildTargetWithParams('/rooms', { roomId: result.id, _hl: result.title });
    case 'center':
      if (result.href.startsWith('/student/')) {
        return buildTargetWithParams('/student/schedule', { centerId: result.id });
      }
      if (result.href.startsWith('/proctor/')) {
        return buildTargetWithParams('/proctor/schedule', { centerId: result.id });
      }
      return buildTargetWithParams('/centers', { centerId: result.id, _hl: result.title });
    case 'semester':
      return buildTargetWithParams('/semesters', { semesterId: result.id, _hl: result.title });
    case 'department':
      return buildTargetWithParams('/departments', { programId: result.id, _hl: result.title });
    default:
      return result.href;
  }
};

export const CommandSearch: React.FC<Props> = ({
  open,
  onOpenChange,
  quickActions = QUICK_ACTIONS,
  placeholder = 'Search schedules, exams, students, rooms, proctors...',
  initialTitle = 'Search the scheduling command center',
  initialDescription = 'Find exams, courses, students, proctors, rooms, semesters and published schedules.',
  emptyDescription = 'Try a course code, student ID, room name or schedule name.',
  footerLabel = 'Enterprise Scheduling Command Search',
  recentStorageKey = RECENT_KEY,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [recent, setRecent] = React.useState<SearchResult[]>(() => loadRecent(recentStorageKey));
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const { data, isFetching, isError, isDebouncing, enabled } = useGlobalSearch(query);
  const { isValid: isRecentItemValid, validationMap } = useValidateRecentItems(recent);

  // Automatically remove invalid items from recent list to keep history clean
  React.useEffect(() => {
    const invalidItems = recent.filter((item) => validationMap[`${item.type}-${item.id}`] === false);
    if (invalidItems.length > 0) {
      const cleaned = recent.filter((item) => validationMap[`${item.type}-${item.id}`] !== false);
      setRecent(cleaned);
      localStorage.setItem(recentStorageKey, JSON.stringify(cleaned));
    }
  }, [validationMap, recent, recentStorageKey]);

  // Reset state every time the palette opens, refocus input.
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setRecent(loadRecent(recentStorageKey));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, recentStorageKey]);

  const visibleActions = React.useMemo(
    () => quickActions.filter((a) => matchesQuickAction(a, query)),
    [query, quickActions]
  );

  const groups = React.useMemo(() => data?.groups ?? [], [data?.groups]);

  const flat: FlatItem[] = React.useMemo(() => {
    const items: FlatItem[] = [];
    visibleActions.forEach((action) => items.push({ kind: 'action', action }));
    groups.forEach((group) => {
      group.items.forEach((result) => items.push({ kind: 'result', result, group }));
    });
    return items;
  }, [visibleActions, groups]);

  React.useEffect(() => {
    if (activeIndex >= flat.length) {
      setActiveIndex(Math.max(0, flat.length - 1));
    }
  }, [flat.length, activeIndex]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep active row scrolled into view as user navigates with arrow keys.
  React.useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-row-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runResult = React.useCallback(
    (result: SearchResult) => {
      // Don't navigate if the item is no longer valid
      if (!isRecentItemValid(result)) return;
      
      pushRecent(recentStorageKey, result);
      onOpenChange(false);
      const target = resolveSearchTarget(result);
      setTimeout(() => navigate(target), 0);
    },
    [navigate, onOpenChange, recentStorageKey, isRecentItemValid]
  );

  const runAction = React.useCallback(
    (action: QuickAction) => {
      onOpenChange(false);
      const href = action.href;
      setTimeout(() => navigate(href), 0);
    },
    [navigate, onOpenChange]
  );

  const runIndex = React.useCallback(
    (index: number) => {
      const item = flat[index];
      if (!item) return;
      if (item.kind === 'result') runResult(item.result);
      else runAction(item.action);
    },
    [flat, runAction, runResult]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runIndex(activeIndex);
    }
  };

  const showRecent = !enabled && recent.length > 0;
  const showEmpty =
    enabled &&
    !isFetching &&
    !isDebouncing &&
    flat.length === 0;

  const showInitial = !enabled && recent.length === 0;

  let rowCursor = 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-60 bg-zinc-950/40 backdrop-blur-sm dark:bg-black/65 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-label="Command search"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed left-1/2 top-[12vh] z-61 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-900/5 backdrop-blur-xl outline-none dark:border-zinc-800/80 dark:bg-zinc-950/95! dark:ring-white/5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search across schedules, exams, students, rooms, proctors and more.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
            <SearchIcon className="size-5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-9 w-full bg-transparent text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
              aria-label="Search query"
              autoComplete="off"
              spellCheck={false}
            />
            {(isFetching || isDebouncing) && enabled ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-zinc-400" />
            ) : null}
            <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] font-semibold text-zinc-500 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              ESC
            </kbd>
          </div>

          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto px-2 py-2 [scrollbar-gutter:stable]"
          >
            {/* Quick actions */}
            {visibleActions.length > 0 && (
              <Section title="Quick Actions">
                {visibleActions.map((action) => {
                  const index = rowCursor++;
                  return (
                    <Row
                      key={action.id}
                      index={index}
                      active={index === activeIndex}
                      onSelect={() => runAction(action)}
                      onHover={() => setActiveIndex(index)}
                      icon={action.icon}
                      title={action.label}
                      subtitle={action.description}
                      badge="Action"
                      tone="accent"
                    />
                  );
                })}
              </Section>
            )}

            {/* Search result groups */}
            {enabled &&
              groups.map((group) => (
                <Section key={group.key} title={group.label}>
                  {group.items.map((result) => {
                    const index = rowCursor++;
                    const Icon = iconForType[result.type] ?? Bookmark;
                    return (
                      <Row
                        key={`${result.type}-${result.id}`}
                        index={index}
                        active={index === activeIndex}
                        onSelect={() => runResult(result)}
                        onHover={() => setActiveIndex(index)}
                        icon={Icon}
                        title={result.title}
                        subtitle={result.subtitle}
                        badge={result.badge ?? result.type}
                      />
                    );
                  })}
                </Section>
              ))}

            {/* Recent searches */}
            {showRecent && (
              <Section title="Recent">
                {recent.map((result) => {
                  const Icon = iconForType[result.type] ?? Bookmark;
                  const isValid = isRecentItemValid(result);
                  return (
                    <Row
                      key={`recent-${result.type}-${result.id}`}
                      index={-1}
                      active={false}
                      onSelect={() => runResult(result)}
                      onHover={() => undefined}
                      icon={Icon}
                      title={result.title}
                      subtitle={result.subtitle}
                      badge={result.badge ?? result.type}
                      muted
                      disabled={!isValid}
                      disabledReason={!isValid ? "This item has been deleted" : undefined}
                    />
                  );
                })}
              </Section>
            )}

            {showInitial && (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-300">
                  <SearchIcon className="size-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {initialTitle}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {initialDescription}
                </p>
              </div>
            )}

            {showEmpty && (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-300">
                  <X className="size-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No matches for &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {emptyDescription}
                </p>
              </div>
            )}

            {isError && (
              <div className="px-4 py-3 text-center text-xs font-medium text-rose-600">
                Search service is unavailable. Please try again.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/70 bg-zinc-50/70 px-4 py-2.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Kbd>
                  <CornerDownLeft className="size-3" />
                </Kbd>
                open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Kbd>ESC</Kbd>
                close
              </span>
            </div>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Sparkles className="size-3.5 text-zinc-400" />
              {footerLabel}
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="px-1 py-1.5">
    <div className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
      {title}
    </div>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const Row: React.FC<{
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: string;
  tone?: 'default' | 'accent';
  muted?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}> = ({ index, active, onSelect, onHover, icon: Icon, title, subtitle, badge, tone = 'default', muted, disabled, disabledReason }) => (
  <button
    type="button"
    data-active={active || undefined}
    data-row-index={index >= 0 ? index : undefined}
    onMouseEnter={onHover}
    onClick={onSelect}
    disabled={disabled}
    title={disabledReason}
    className={cn(
      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer',
      disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent',
      active && !disabled
        ? 'bg-zinc-950 text-white dark:bg-zinc-800 dark:text-zinc-50'
        : !disabled && 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80',
      muted && !active && !disabled && 'opacity-90'
    )}
  >
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
        active && !disabled
          ? 'border-transparent bg-white/15 text-white dark:bg-zinc-700/80 dark:text-zinc-50'
          : tone === 'accent'
            ? 'border-zinc-200/80 bg-linear-to-br from-zinc-100 to-zinc-50 text-zinc-700 dark:border-zinc-700/80 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200'
            : 'border-zinc-200/70 bg-white text-zinc-600 group-hover:border-zinc-300 dark:border-zinc-700/70 dark:bg-zinc-950 dark:text-zinc-300 dark:group-hover:border-zinc-600 dark:group-hover:bg-zinc-900'
      )}
    >
      <Icon className="size-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold">{title}</span>
      {subtitle && (
        <span
          className={cn(
            'mt-0.5 block truncate text-xs font-medium',
            active && !disabled ? 'text-white/70 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
          )}
        >
          {subtitle}
        </span>
      )}
      {disabled && disabledReason && (
        <span className="mt-0.5 block truncate text-xs font-medium text-rose-600 dark:text-rose-400">
          {disabledReason}
        </span>
      )}
    </span>
    {badge && (
      <span
        className={cn(
          'hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex',
          active && !disabled
            ? 'border-white/20 bg-white/10 text-white dark:border-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-100'
            : 'border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'
        )}
      >
        {badge}
      </span>
    )}
    <ArrowRight
      className={cn(
        'size-4 shrink-0 opacity-0 transition-opacity',
        active && !disabled && 'opacity-100'
      )}
    />
  </button>
);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-zinc-200 bg-white px-1 text-[10px] font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
    {children}
  </kbd>
);

type SearchTriggerProps = {
  onOpen: () => void;
  className?: string;
  placeholder?: string;
};

/**
 * The "input-looking" trigger button that sits in the navbar and opens the
 * command palette. Visually mimics a premium rounded search bar.
 */
export const CommandSearchTrigger: React.FC<SearchTriggerProps> = ({ onOpen, className, placeholder = 'Search schedules, exams, students, rooms, proctors...' }) => {
  const [shortcut, setShortcut] = React.useState('Ctrl K');

  React.useEffect(() => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setShortcut(isMac ? '⌘ K' : 'Ctrl K');
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative flex h-11 w-full items-center gap-3 rounded-full border border-zinc-200/80 bg-zinc-50/70 px-4 text-left text-sm text-zinc-500 shadow-sm shadow-zinc-200/40 transition-all hover:border-zinc-300 hover:bg-white hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700/70 dark:bg-zinc-950/80 dark:text-zinc-300 dark:shadow-black/20 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700',
        className
      )}
      aria-label="Open command search"
    >
      <SearchIcon className="size-4 shrink-0" />
      <span className="flex-1 truncate font-medium">
        {placeholder}
      </span>
      <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 text-[10px] font-semibold text-zinc-500 shadow-sm md:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-black/20">
        {shortcut}
      </kbd>
    </button>
  );
};

type CompactSearchButtonProps = {
  onOpen: () => void;
  className?: string;
};

/** Icon-only search trigger for mobile / compact layouts. */
export const CompactSearchButton: React.FC<CompactSearchButtonProps> = ({ onOpen, className }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onOpen}
    aria-label="Open command search"
    className={cn(
      'rounded-full border border-zinc-200/70 bg-white/80 text-zinc-600 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/70 dark:bg-zinc-950/80 dark:text-zinc-200 dark:shadow-black/20 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-50',
      className
    )}
  >
    <SearchIcon className="size-4.5" />
  </Button>
);

export type { SearchResult } from '@/api/search.api';

/**
 * Hook that wires the global Ctrl+K / Cmd+K shortcut.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useCommandSearchShortcut = (toggle: () => void) => {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);
};

export type { QuickAction };
