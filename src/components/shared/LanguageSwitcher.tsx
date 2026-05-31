import React from 'react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';

/**
 * Language switcher dropdown. Changing the language updates the entire UI instantly
 * (react-i18next re-renders subscribers), persists to localStorage, and toggles the
 * document text direction (RTL for Arabic, LTR otherwise) — all without a full reload.
 */
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { t, i18n } = useTranslation('common');
  const activeCode = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0];
  const active = SUPPORTED_LANGUAGES.find((lang) => lang.code === activeCode) ?? SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    if (code !== i18n.resolvedLanguage) {
      void i18n.changeLanguage(code);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('selectLanguage')}
              className={cn(
                'rounded-full border border-zinc-200/70 bg-white/80 text-zinc-600 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800',
                className
              )}
            >
              <Languages className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="font-medium">
          {t('language')}: {active.flag} {active.label}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" sideOffset={12} className="w-48 rounded-2xl p-2">
        <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = lang.code === active.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn('gap-2.5', isActive && 'bg-zinc-100 dark:bg-zinc-800')}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex-1 font-medium">{lang.label}</span>
              {isActive && <Check className="size-4 text-emerald-600 dark:text-emerald-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
