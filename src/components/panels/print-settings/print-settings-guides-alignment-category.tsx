import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import type { CutGuideStyle, GridAlignment } from '@/types/print'
import {
    Circle,
    MoveDownLeft,
    MoveDownRight,
    MoveUpLeft,
    MoveUpRight,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    type LucideIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SIMPLE_ALIGNMENT_OPTIONS: Array<{ value: GridAlignment; icon: LucideIcon }> = [
    { value: 'top-left', icon: MoveUpLeft },
    { value: 'top-right', icon: MoveUpRight },
    { value: 'center', icon: Circle },
    { value: 'bottom-left', icon: MoveDownLeft },
    { value: 'bottom-right', icon: MoveDownRight }
]

const FULL_ALIGNMENT_OPTIONS: Array<{ value: GridAlignment; icon: LucideIcon }> = [
    { value: 'top-left', icon: MoveUpLeft },
    { value: 'top-center', icon: ArrowUp },
    { value: 'top-right', icon: MoveUpRight },
    { value: 'center-left', icon: ArrowLeft },
    { value: 'center', icon: Circle },
    { value: 'center-right', icon: ArrowRight },
    { value: 'bottom-left', icon: MoveDownLeft },
    { value: 'bottom-center', icon: ArrowDown },
    { value: 'bottom-right', icon: MoveDownRight }
]

export function PrintSettingsGuidesAlignmentCategory() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()
    const [showAdvanced, setShowAdvanced] = useState(false)

    const options = showAdvanced ? FULL_ALIGNMENT_OPTIONS : SIMPLE_ALIGNMENT_OPTIONS

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                    <Label className="text-sm">{t('settings.cropGuides')}</Label>
                    <Switch
                        checked={state.showCropGuides}
                        onCheckedChange={actions.setShowCropGuides}
                    />
                </div>
                {state.showCropGuides && (
                    <div className="flex gap-2">
                        {(['crosses', 'dotted', 'dashed'] as CutGuideStyle[]).map((style) => (
                            <Button
                                key={style}
                                type="button"
                                variant={state.cutGuideStyle === style ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => actions.setCutGuideStyle(style)}
                                className="flex-1"
                            >
                                {t(`settings.guideStyle.${style}`)}
                            </Button>
                        ))}
                    </div>
                )}
                <div className="text-muted-foreground text-xs">{t('settings.cropGuidesHelp')}</div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>{t('settings.gridAlignment')}</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced((v) => !v)}
                    >
                        {showAdvanced
                            ? t('settings.simple') || 'Simple'
                            : t('settings.advanced') || 'Advanced'}
                    </Button>
                </div>
                <div className={`gap-2 ${showAdvanced ? 'grid grid-cols-3' : 'flex flex-wrap'}`}>
                    {options.map((option) => {
                        const Icon = option.icon
                        const isActive = option.value === state.gridAlignment

                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant={isActive ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => actions.setGridAlignment(option.value)}
                                aria-label={t(`settings.alignment.${option.value}`)}
                                title={t(`settings.alignment.${option.value}`)}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        )
                    })}
                </div>
                <div className="text-muted-foreground text-xs">{t('settings.gridAlignmentHelp')}</div>
            </div>
        </div>
    )
}