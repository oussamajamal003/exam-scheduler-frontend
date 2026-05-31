import React from 'react';
import { useTranslation } from 'react-i18next';

import appI18n from '@/i18n';

type AppTextDictionary = {
  __lexicon?: Record<string, string>;
};

type LanguageLexicon = Record<string, string>;
type PreparedLexicon = {
  exact: Map<string, string>;
  reverseExact: Map<string, string>;
  phrases: Array<{ regex: RegExp; replacement: string }>;
};

const lexiconLoaders: Record<string, () => Promise<AppTextDictionary>> = {
  fr: () => import('@/i18n/locales/fr/appText.json').then((module) => (module.default ?? module) as AppTextDictionary),
  ar: () => import('@/i18n/locales/ar/appText.json').then((module) => (module.default ?? module) as AppTextDictionary),
};

const lexiconPromises = new Map<string, Promise<LanguageLexicon>>();
const preparedLexicons = new Map<string, PreparedLexicon>();

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const originalTextNodes = new WeakMap<Text, string>();
const lastAppliedTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Partial<Record<(typeof TRANSLATABLE_ATTRIBUTES)[number], string>>>();
const lastAppliedAttributes = new WeakMap<Element, Partial<Record<(typeof TRANSLATABLE_ATTRIBUTES)[number], string>>>();

const SKIP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'code',
  'pre',
  'textarea',
  '[contenteditable="true"]',
  '[data-i18n-skip]',
].join(',');

const shouldSkipText = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed.length < 2 ||
    /^[\d\s.,:;/%+\-()[\]#]+$/.test(trimmed) ||
    /^[A-Z0-9_-]{2,}$/.test(trimmed) ||
    /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed) ||
    /^https?:\/\//i.test(trimmed)
  );
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const phraseRegex = (phrase: string) => {
  const escaped = escapeRegExp(phrase);
  const startsWithWord = /^\w/.test(phrase);
  const endsWithWord = /\w$/.test(phrase);
  return new RegExp(`${startsWithWord ? '\\b' : ''}${escaped}${endsWithWord ? '\\b' : ''}`, 'gi');
};

const WORD_TRANSLATIONS = [
  'Course Offerings',
  'Time Slots',
  'Assigned Students',
  'Published Schedule',
  'Exam Schedule',
  'Schedule Versions',
  'No exam',
  'exams',
  'exam',
  'students',
  'student',
  'courses',
  'course',
  'rooms',
  'room',
  'centers',
  'center',
  'assignments',
  'assignment',
  'schedules',
  'schedule',
  'days',
  'day',
  'per day',
  'status',
  'version',
  'versions',
] as const;

const prepareLexicon = (language: string, lexicon: LanguageLexicon): PreparedLexicon => {
  const exact = new Map<string, string>();
  const reverseExact = new Map<string, string>();
  for (const [key, value] of Object.entries(lexicon)) {
    exact.set(key.toLowerCase(), value);
    reverseExact.set(value.toLowerCase(), key);
  }

  const phrases = Array.from(new Set([...Object.keys(lexicon), ...WORD_TRANSLATIONS]))
    .sort((first, second) => second.length - first.length)
    .flatMap((phrase) => {
      const replacement = exact.get(phrase.toLowerCase());
      return replacement ? [{ regex: phraseRegex(phrase), replacement }] : [];
    });

  const prepared = { exact, reverseExact, phrases };
  preparedLexicons.set(language, prepared);
  return prepared;
};

const getSourceFromLoadedLexicons = (value: string) => {
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const core = value.trim();
  if (!core) return undefined;

  const normalized = core.toLowerCase();
  for (const prepared of preparedLexicons.values()) {
    const source = prepared.reverseExact.get(normalized);
    if (source) return `${leading}${source}${trailing}`;
  }

  return undefined;
};

const loadLexicon = (language: string) => {
  const code = language.split('-')[0];
  if (code === 'en') return Promise.resolve<LanguageLexicon>({});

  const existing = lexiconPromises.get(code);
  if (existing) return existing;

  const loader = lexiconLoaders[code];
  const promise = loader
    ? loader().then((dictionary) => {
        const lexicon = dictionary.__lexicon ?? {};
        appI18n.addResourceBundle(code, 'appText', dictionary, true, true);
        prepareLexicon(code, lexicon);
        return lexicon;
      })
    : Promise.resolve({});

  lexiconPromises.set(code, promise);
  return promise;
};

const translateDynamicText = (core: string, languageCode: string) => {
  const pageMatch = core.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i);
  if (pageMatch) {
    return languageCode === 'ar'
      ? `صفحة ${pageMatch[1]} من ${pageMatch[2]}`
      : `Page ${pageMatch[1]} sur ${pageMatch[2]}`;
  }

  const capacityMatch = core.match(/^Capacity\s+(.+)$/i);
  if (capacityMatch) {
    return languageCode === 'ar' ? `السعة ${capacityMatch[1]}` : `Capacité ${capacityMatch[1]}`;
  }

  const proctorsCountMatch = core.match(/^Proctors\s*\((\d+)\)$/i);
  if (proctorsCountMatch) {
    return languageCode === 'ar' ? `المراقبون (${proctorsCountMatch[1]})` : `Surveillants (${proctorsCountMatch[1]})`;
  }

  const studentsCountMatch = core.match(/^Students\s*\((\d+)\)$/i);
  if (studentsCountMatch) {
    return languageCode === 'ar' ? `الطلاب (${studentsCountMatch[1]})` : `Étudiants (${studentsCountMatch[1]})`;
  }

  const noExamDaysMatch = core.match(/^No exam\s*\((\d+)\s+days?\)\.?$/i);
  if (noExamDaysMatch) {
    return languageCode === 'ar'
      ? `لا يوجد امتحان (${noExamDaysMatch[1]} أيام).`
      : `Aucun examen (${noExamDaysMatch[1]} jours).`;
  }

  const welcomeMatch = core.match(/^Welcome,\s+(.+)$/i);
  if (welcomeMatch) {
    return languageCode === 'ar' ? `مرحباً، ${welcomeMatch[1]}` : `Bienvenue, ${welcomeMatch[1]}`;
  }

  const viewDetailsMatch = core.match(/^View details for\s+(.+)$/i);
  if (viewDetailsMatch) {
    return languageCode === 'ar'
      ? `عرض تفاصيل ${viewDetailsMatch[1]}`
      : `Voir les détails de ${viewDetailsMatch[1]}`;
  }

  const loadingMatch = core.match(/^Loading\s+(.+)$/i);
  if (loadingMatch) {
    return languageCode === 'ar' ? `جارٍ تحميل ${loadingMatch[1]}` : `Chargement de ${loadingMatch[1]}`;
  }

  const busiestDayMatch = core.match(/^(\d+)\/(\d+)\s+on busiest day$/i);
  if (busiestDayMatch) {
    return languageCode === 'ar'
      ? `${busiestDayMatch[1]}/${busiestDayMatch[2]} في أكثر الأيام ازدحاماً`
      : `${busiestDayMatch[1]}/${busiestDayMatch[2]} le jour le plus chargé`;
  }

  const examsCountMatch = core.match(/^(\d+)\s+exams?$/i);
  if (examsCountMatch) {
    return languageCode === 'ar' ? `${examsCountMatch[1]} امتحان` : `${examsCountMatch[1]} examens`;
  }

  const studentsInlineMatch = core.match(/^(\d+)\s+students?$/i);
  if (studentsInlineMatch) {
    return languageCode === 'ar' ? `${studentsInlineMatch[1]} طالب` : `${studentsInlineMatch[1]} étudiants`;
  }

  return undefined;
};

const translateWithLexicon = (value: string, language: string, prepared?: PreparedLexicon) => {
  const code = language.split('-')[0];
  if (code === 'en' || shouldSkipText(value)) return value;
  if (!prepared) return value;

  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const core = value.trim();
  if (!core) return value;

  const exact = prepared.exact.get(core.toLowerCase());
  if (exact) return `${leading}${exact}${trailing}`;

  const dynamic = translateDynamicText(core, code);
  if (dynamic) return `${leading}${dynamic}${trailing}`;

  let translated = core;

  for (const { regex, replacement } of prepared.phrases) {
    translated = translated.replace(regex, replacement);
  }

  return `${leading}${translated}${trailing}`;
};

const getOriginalAttribute = (element: Element, attribute: (typeof TRANSLATABLE_ATTRIBUTES)[number]) => {
  const existing = originalAttributes.get(element)?.[attribute];
  const current = element.getAttribute(attribute);
  const lastApplied = lastAppliedAttributes.get(element)?.[attribute];

  if (existing !== undefined && current !== null && current !== lastApplied) {
    const nextOriginal = getSourceFromLoadedLexicons(current) ?? current;
    const next = { ...(originalAttributes.get(element) ?? {}), [attribute]: nextOriginal };
    originalAttributes.set(element, next);
    return nextOriginal;
  }

  if (existing !== undefined) return existing;

  const value = current;
  if (value === null) return null;

  const original = getSourceFromLoadedLexicons(value) ?? value;
  const next = { ...(originalAttributes.get(element) ?? {}), [attribute]: original };
  originalAttributes.set(element, next);
  return original;
};

const translateElementAttributes = (element: Element, language: string, prepared?: PreparedLexicon) => {
  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    if (!element.hasAttribute(attribute) && originalAttributes.get(element)?.[attribute] === undefined) continue;
    const original = getOriginalAttribute(element, attribute);
    if (original === null) continue;
    const translated = translateWithLexicon(original, language, prepared);
    if (element.getAttribute(attribute) === translated) continue;
    element.setAttribute(attribute, translated);
    const next = { ...(lastAppliedAttributes.get(element) ?? {}), [attribute]: translated };
    lastAppliedAttributes.set(element, next);
  }
};

const translateTextNode = (node: Text, language: string, prepared?: PreparedLexicon) => {
  const current = node.nodeValue ?? '';
  const lastApplied = lastAppliedTextNodes.get(node);
  let original = originalTextNodes.get(node);

  if (original === undefined || current !== lastApplied) {
    original = getSourceFromLoadedLexicons(current) ?? current;
    originalTextNodes.set(node, original);
  }

  const translated = translateWithLexicon(original, language, prepared);
  if (node.nodeValue === translated) return;
  node.nodeValue = translated;
  lastAppliedTextNodes.set(node, translated);
};

const translateNode = (node: Node, language: string, prepared?: PreparedLexicon) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP_SELECTOR)) return;
    translateTextNode(node as Text, language, prepared);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (element.matches(SKIP_SELECTOR)) return;
  translateElementAttributes(element, language, prepared);
};

const translateTree = (root: HTMLElement | Element, language: string, prepared?: PreparedLexicon) => {
  translateElementAttributes(root, language, prepared);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        return element.matches(SKIP_SELECTOR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }

      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(node as Element, language, prepared);
    } else if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node as Text, language, prepared);
    }
    node = walker.nextNode();
  }
};

const getTranslationRoots = (root: HTMLElement) => {
  const roots: Node[] = [root];
  for (const child of Array.from(document.body.children)) {
    if (child !== root && !root.contains(child) && !child.contains(root)) roots.push(child);
  }
  return roots;
};

export const PageTranslationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { i18n } = useTranslation('common');
  const rootRef = React.useRef<HTMLDivElement>(null);
  const isApplyingRef = React.useRef(false);
  const frameRef = React.useRef<number | null>(null);
  const pendingNodesRef = React.useRef<Set<Node>>(new Set());
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  const activeLanguageRef = React.useRef(activeLanguage);
  const loadVersionRef = React.useRef(0);
  const fullTranslationPendingRef = React.useRef(false);

  const scheduleTranslation = React.useCallback((nodes?: Iterable<Node>, isFullTranslation = false) => {
    const root = rootRef.current;
    if (!root) return;

    if (nodes) {
      for (const node of nodes) pendingNodesRef.current.add(node);
    }

    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      const language = activeLanguageRef.current;
      const code = language.split('-')[0];
      const prepared = preparedLexicons.get(code);
      const pendingNodes = pendingNodesRef.current;
      const targets = pendingNodes.size > 0 ? Array.from(pendingNodes) : getTranslationRoots(root);
      pendingNodes.clear();

      try {
        isApplyingRef.current = true;
        for (const target of targets) {
          if (target === root) {
            translateTree(root, language, prepared);
          } else if (target instanceof Element && document.body.contains(target)) {
            translateTree(target, language, prepared);
          } else if (target instanceof Text && document.body.contains(target.parentElement)) {
            translateNode(target, language, prepared);
          }
        }
      } finally {
        isApplyingRef.current = false;
        if (isFullTranslation) fullTranslationPendingRef.current = false;
        frameRef.current = null;
      }
    });
  }, []);

  const applyLanguage = React.useCallback((language: string, nodes?: Iterable<Node>) => {
    const isFullTranslation = nodes === undefined;
    const version = isFullTranslation ? ++loadVersionRef.current : loadVersionRef.current;
    activeLanguageRef.current = language;
    if (isFullTranslation) fullTranslationPendingRef.current = true;

    void loadLexicon(language).then(() => {
      if (version !== loadVersionRef.current) return;
      if (!isFullTranslation && fullTranslationPendingRef.current) return;
      scheduleTranslation(nodes, isFullTranslation);
    });
  }, [scheduleTranslation]);

  React.useEffect(() => {
    applyLanguage(activeLanguage);
  }, [activeLanguage, applyLanguage]);

  React.useEffect(() => {
    const handleLanguageChanged = (language: string) => {
      applyLanguage(language);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [applyLanguage, i18n]);

  React.useEffect(() => {
    const root = document.body;
    if (!root) return;

    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return;

      const changedNodes = new Set<Node>();
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => changedNodes.add(node));
        } else {
          changedNodes.add(mutation.target);
        }
      }

      if (changedNodes.size > 0) applyLanguage(activeLanguageRef.current, changedNodes);
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    return () => observer.disconnect();
  }, [applyLanguage]);

  return <div ref={rootRef}>{children}</div>;
};

export default PageTranslationProvider;
