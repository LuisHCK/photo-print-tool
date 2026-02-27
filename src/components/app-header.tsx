import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    SUPPORTED_LANGUAGES,
    getCurrentSupportedLanguage,
    type SupportedLanguage
} from '@/i18n'
import { MoonIcon, Settings2Icon, SunIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type AppHeaderProps = {
    onPrint: () => void
}

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'photo-print.theme'

function getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
        return 'light'
    }

    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
        return saved
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeMode) {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return
    }

    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function AppHeader({ onPrint }: AppHeaderProps) {
    const { t, i18n } = useTranslation()
    const currentLanguage = getCurrentSupportedLanguage()
    const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    function toggleTheme() {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
    }

    return (
        <header className="no-print flex items-center justify-between border-b bg-card px-6 py-3">
            <div>
                <h1 className="text-lg font-semibold">{t('app.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('app.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={t('app.settings')}>
                            <Settings2Icon className="size-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-84 space-y-4">
                        <div className="flex justify-between items-center space-y-2">
                            <Label className='mb-0'>{t('app.theme')}</Label>
                            <Button variant="outline" onClick={toggleTheme} size="sm">
                                {theme === 'dark'
                                    ? <SunIcon className="size-4" />
                                    : <MoonIcon className="size-4" />}
                            </Button>
                        </div>
                        <div className="flex justify-between items-center space-y-2 gap-4">
                            <Label className='mb-0'>{t('app.language')}</Label>
                            <Select
                                value={currentLanguage}
                                onValueChange={(next) =>
                                    i18n.changeLanguage(next as SupportedLanguage)
                                }
                            >
                                <SelectTrigger className="w-auto">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_LANGUAGES.map((language) => (
                                        <SelectItem key={language} value={language}>
                                            {t(`app.languageOptions.${language}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </PopoverContent>
                </Popover>
                <Button onClick={onPrint}>{t('app.print')}</Button>
            </div>
        </header>
    )
}
