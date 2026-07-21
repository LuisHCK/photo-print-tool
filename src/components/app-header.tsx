import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { NativePrintContext } from '@/context/native-print-context'
import {
    MoonIcon,
    PrinterIcon,
    Settings2Icon,
    SunIcon
} from 'lucide-react'
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
    const native = useContext(NativePrintContext)

    console.log(native)

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    function toggleTheme() {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
    }

    const printer = native?.printers.find((p) => p.id === native.selectedPrinterId)
    const paperSizes = printer?.paperSizes ?? []
    const qualities = printer?.qualities ?? []

    return (
        <header className="no-print flex items-center justify-between border-b bg-card px-6 py-3">
            <div>
                <h1 className="text-lg font-semibold">{t('app.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('app.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
                {native?.isNative && (
                    <>
                        <Select
                            value={native.selectedPrinterId ?? undefined}
                            onValueChange={native.setSelectedPrinterId}
                            disabled={native.loading}
                        >
                            <SelectTrigger className="w-56">
                                <PrinterIcon className="size-4 mr-2 shrink-0" />
                                <SelectValue
                                    placeholder={
                                        native.loading
                                            ? '…'
                                            : native.error
                                                ? native.error
                                                : t('app.selectPrinter')
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {native.printers.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" aria-label={t('printSettings.printOptions')}>
                                <Settings2Icon className="size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    {t('printSettings.paperType')}
                                </Label>
                                <Select
                                    value={native.selectedPaperSizeId ?? undefined}
                                    onValueChange={native.setSelectedPaperSizeId}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paperSizes.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name} &mdash; {s.widthMm}&times;{s.heightMm} mm
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    {t('printSettings.quality')}
                                </Label>
                                <Select
                                    value={native.selectedQualityDpi?.toString() ?? undefined}
                                    onValueChange={(v) => native.setSelectedQualityDpi(Number(v))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {qualities.map((q) => (
                                            <SelectItem key={q.dpi} value={q.dpi.toString()}>
                                                {q.name} ({q.dpi} DPI)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    {t('printSettings.colorMode')}
                                </Label>
                                <Select
                                    value={native.colorMode}
                                    onValueChange={(v) => native.setColorMode(v as 'color' | 'grayscale')}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="color">{t('printSettings.color')}</SelectItem>
                                        <SelectItem value="grayscale">{t('printSettings.grayscale')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    {t('printSettings.copies')}
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={999}
                                    value={native.copies}
                                    onChange={(e) => native.setCopies(Math.max(1, Number(e.target.value)))}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => console.log('print', {
                                    printerId: native.selectedPrinterId,
                                    paperSizeId: native.selectedPaperSizeId,
                                    qualityDpi: native.selectedQualityDpi,
                                    colorMode: native.colorMode,
                                    copies: native.copies,
                                })}
                            >
                                {t('printSettings.printNow')}
                            </Button>
                        </PopoverContent>
                    </Popover>
                </>)
                }

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={t('app.settings')}>
                            <Settings2Icon className="size-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-84 space-y-4">
                        <div className="flex justify-between items-center space-y-2">
                            <Label>{t('app.theme')}</Label>
                            <Button
                                variant="outline"
                                onClick={toggleTheme}
                                size="sm"
                                aria-label={
                                    theme === 'dark'
                                        ? t('app.switchToLight') || 'Switch to light mode'
                                        : t('app.switchToDark') || 'Switch to dark mode'
                                }
                            >
                                {theme === 'dark'
                                    ? <SunIcon className="size-4" />
                                    : <MoonIcon className="size-4" />}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Label>{t('app.language')}</Label>
                            <Select
                                value={currentLanguage}
                                onValueChange={(next) => {
                                    i18n.changeLanguage(next as SupportedLanguage).catch(() => {})
                                }}
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

                <Button onClick={onPrint} aria-label={t('app.print')}>
                    {t('app.print')}
                </Button>
            </div>
        </header>
    )
}
