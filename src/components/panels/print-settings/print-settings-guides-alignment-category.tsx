import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import type { GridAlignment } from '@/types/print'
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Circle,
    MoveDownLeft,
    MoveDownRight,
    MoveUpLeft,
    MoveUpRight,
    type LucideIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GRID_ALIGNMENT_OPTIONS: Array<{ value: GridAlignment; icon: LucideIcon }> = [
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
                <div className="text-muted-foreground text-xs">{t('settings.cropGuidesHelp')}</div>
            </div>

            <div className="space-y-2">
                <Label>{t('settings.gridAlignment')}</Label>
                <div className="grid grid-cols-3 gap-2">
                    {GRID_ALIGNMENT_OPTIONS.map((option) => {
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