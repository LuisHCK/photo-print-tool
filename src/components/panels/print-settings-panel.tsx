import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ChevronDown,
    ChevronUp,
    Circle,
    MoveDownLeft,
    MoveDownRight,
    MoveUpLeft,
    MoveUpRight,
    type LucideIcon
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { PrintSettingsProfilesSection } from '@/components/panels/print-settings-profiles-section'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import type {
    GridAlignment,
    Orientation,
    Unit
} from '@/types/print'
import { useState } from 'react'
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

export function PrintSettingsPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()
    const [showAlignmentPicker, setShowAlignmentPicker] = useState(false)

    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>{t('settings.title')}</CardTitle>
                <CardDescription>{t('settings.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>{t('settings.paperSize')}</Label>
                    <Select value={state.paperId} onValueChange={actions.setPaperId}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {state.paperPresets.map((paperPreset) => (
                                <SelectItem key={paperPreset.id} value={paperPreset.id}>
                                    {t(`presets.paper.${paperPreset.id}`, {
                                        defaultValue: paperPreset.name
                                    })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>{t('settings.layout')}</Label>
                    <Select value={state.layoutId} onValueChange={actions.updateLayout}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {state.layoutPresets.map((layoutPreset) => (
                                <SelectItem key={layoutPreset.id} value={layoutPreset.id}>
                                    {t(`presets.layout.${layoutPreset.id}`, {
                                        defaultValue: layoutPreset.name
                                    })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>{t('settings.orientation')}</Label>
                        <Select
                            value={state.orientation}
                            onValueChange={(nextValue) =>
                                actions.setOrientation(nextValue as Orientation)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="portrait">{t('settings.portrait')}</SelectItem>
                                <SelectItem value="landscape">{t('settings.landscape')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('settings.units')}</Label>
                        <Select
                            value={state.unit}
                            onValueChange={(nextValue) => actions.updateUnit(nextValue as Unit)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mm">mm</SelectItem>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="in">in</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t('settings.copiesPerPage')}</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            type="number"
                            min={1}
                            step="1"
                            value={state.selectedLayoutColumns}
                            onChange={(event) =>
                                actions.updateLayoutColumns(Number(event.target.value))
                            }
                        />
                        <Input
                            type="number"
                            min={1}
                            step="1"
                            value={state.selectedLayoutRows}
                            onChange={(event) =>
                                actions.updateLayoutRows(Number(event.target.value))
                            }
                        />
                    </div>
                    <div className="text-muted-foreground text-xs">{t('settings.columnsRows')}</div>
                </div>

                <div className="space-y-2">
                    <Label>{t('settings.exactPrintSize', { unit: state.unit })}</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            type="number"
                            step="any"
                            min={0}
                            value={state.widthInput.value}
                            onBlur={state.widthInput.onBlur}
                            onChange={(event) => state.widthInput.onChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    state.widthInput.onEnter()
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                        <Input
                            type="number"
                            step="any"
                            min={0}
                            value={state.heightInput.value}
                            onBlur={state.heightInput.onBlur}
                            onChange={(event) => state.heightInput.onChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    state.heightInput.onEnter()
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                    </div>
                    <div className="text-muted-foreground text-xs">{t('settings.widthHeight')}</div>
                </div>

                <div className="space-y-2">
                    <Label>{t('settings.pageSpacing', { unit: state.unit })}</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <Input
                            type="number"
                            step="any"
                            min={0}
                            value={state.marginInput.value}
                            onBlur={state.marginInput.onBlur}
                            onChange={(event) => state.marginInput.onChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    state.marginInput.onEnter()
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                        <Input
                            type="number"
                            step="any"
                            min={0}
                            value={state.horizontalGapInput.value}
                            onBlur={state.horizontalGapInput.onBlur}
                            onChange={(event) =>
                                state.horizontalGapInput.onChange(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    state.horizontalGapInput.onEnter()
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                        <Input
                            type="number"
                            step="any"
                            min={0}
                            value={state.verticalGapInput.value}
                            onBlur={state.verticalGapInput.onBlur}
                            onChange={(event) => state.verticalGapInput.onChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    state.verticalGapInput.onEnter()
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                    </div>
                    <div className="text-muted-foreground text-xs">{t('settings.marginHorizontalVerticalGap')}</div>
                </div>

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
                    <div className="flex items-center justify-between">
                        <Label>{t('settings.gridAlignment')}</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAlignmentPicker((previous) => !previous)}
                            aria-expanded={showAlignmentPicker}
                        >
                            {showAlignmentPicker ? t('settings.hideAlignment') : t('settings.showAlignment')}
                            {showAlignmentPicker ? (
                                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            )}
                        </Button>
                    </div>
                    {showAlignmentPicker ? (
                        <>
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
                            <div className="text-muted-foreground text-xs">
                                {t('settings.gridAlignmentHelp')}
                            </div>
                        </>
                    ) : null}
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>{t('settings.selectedPhotoControls')}</Label>
                    {state.activePhoto ? (
                        <>
                            <div className="text-muted-foreground truncate text-xs">
                                {state.activePhoto.name}
                            </div>
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

                            <div className="space-y-2 rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">
                                        {t('settings.manualImagePosition')}
                                    </Label>
                                    <Switch
                                        checked={state.activePhoto.manualPositionEnabled}
                                        onCheckedChange={
                                            actions.updateActivePhotoManualPositionEnabled
                                        }
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
                                                    actions.updateActivePhotoNudge(
                                                        'up',
                                                        Number(event.target.value)
                                                    )
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
                                                    actions.updateActivePhotoNudge(
                                                        'right',
                                                        Number(event.target.value)
                                                    )
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
                                                    actions.updateActivePhotoNudge(
                                                        'down',
                                                        Number(event.target.value)
                                                    )
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
                                                    actions.updateActivePhotoNudge(
                                                        'left',
                                                        Number(event.target.value)
                                                    )
                                                }
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            {t('settings.pickPhoto')}
                        </p>
                    )}
                </div>

                <Separator />

                <PrintSettingsProfilesSection
                    profiles={state.settingsProfiles}
                    onSaveProfile={actions.saveSettingsProfile}
                    onLoadProfile={actions.loadSettingsProfile}
                    onDeleteProfile={actions.deleteSettingsProfile}
                />
            </CardContent>
        </Card>
    )
}
