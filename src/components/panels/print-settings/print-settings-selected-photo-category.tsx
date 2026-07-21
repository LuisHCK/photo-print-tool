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
import { Switch } from '@/components/ui/switch'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { useTranslation } from 'react-i18next'

export function PrintSettingsSelectedPhotoCategory() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()

    if (!state.activePhoto) {
        return <p className="text-muted-foreground text-sm">{t('settings.pickPhoto')}</p>
    }

    return (
        <div className="space-y-4">
            <div className="text-muted-foreground break-all text-xs">{state.activePhoto.name}</div>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => actions.updateActivePhotoRotation(-90)}
                >
                    {t('settings.rotateMinus')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => actions.updateActivePhotoRotation(90)}
                >
                    {t('settings.rotatePlus')}
                </Button>
            </div>
            <div className="space-y-1">
                <Select
                    value={state.activePhoto.fitMode}
                    onValueChange={(nextValue) =>
                        actions.updateActivePhotoFitMode(nextValue as 'fill' | 'fit')
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fill">{t('settings.fill')}</SelectItem>
                        <SelectItem value="fit">{t('settings.fit')}</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                    {state.activePhoto.fitMode === 'fill'
                        ? t('settings.fillHelp') ||
                          'Fill: photo fills the entire cell (may crop edges)'
                        : t('settings.fitHelp') ||
                          'Fit: photo fits inside the cell (may leave borders)'}
                </p>
            </div>
            <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('settings.manualImagePosition')}</Label>
                    <Switch
                        checked={state.activePhoto.manualPositionEnabled}
                        onCheckedChange={actions.updateActivePhotoManualPositionEnabled}
                    />
                </div>

                {state.activePhoto.manualPositionEnabled ? (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs">{t('settings.moveUp')}</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.5"
                                value={state.activePhoto.nudgeUpPct}
                                onChange={(event) =>
                                    actions.updateActivePhotoNudge('up', Number(event.target.value))
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t('settings.moveRight')}</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.5"
                                value={state.activePhoto.nudgeRightPct}
                                onChange={(event) =>
                                    actions.updateActivePhotoNudge('right', Number(event.target.value))
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t('settings.moveDown')}</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.5"
                                value={state.activePhoto.nudgeDownPct}
                                onChange={(event) =>
                                    actions.updateActivePhotoNudge('down', Number(event.target.value))
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t('settings.moveLeft')}</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.5"
                                value={state.activePhoto.nudgeLeftPct}
                                onChange={(event) =>
                                    actions.updateActivePhotoNudge('left', Number(event.target.value))
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}