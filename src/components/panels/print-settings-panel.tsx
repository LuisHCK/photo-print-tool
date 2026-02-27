import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { NumericInputController } from '@/hooks/use-print-job'
import type {
    FitMode,
    LayoutPreset,
    LayoutPresetId,
    Orientation,
    PaperPreset,
    PaperPresetId,
    PrintSettingsProfile,
    PhotoItem,
    Unit
} from '@/types/print'
import { useTranslation } from 'react-i18next'

interface PrintSettingsPanelProps {
    paperId: PaperPresetId
    layoutId: LayoutPresetId
    orientation: Orientation
    unit: Unit
    layoutColumns: number
    layoutRows: number
    activePhoto: PhotoItem | null
    paperPresets: PaperPreset[]
    layoutPresets: LayoutPreset[]
    settingsProfiles: PrintSettingsProfile[]
    widthInput: NumericInputController
    heightInput: NumericInputController
    marginInput: NumericInputController
    gapInput: NumericInputController
    onPaperIdChange: (paperId: PaperPresetId) => void
    onLayoutChange: (layoutId: LayoutPresetId) => void
    onOrientationChange: (orientation: Orientation) => void
    onUnitChange: (unit: Unit) => void
    onLayoutColumnsChange: (columns: number) => void
    onLayoutRowsChange: (rows: number) => void
    onActivePhotoRotate: (delta: number) => void
    onActivePhotoFitModeChange: (fitMode: FitMode) => void
    onActivePhotoManualPositionEnabledChange: (enabled: boolean) => void
    onActivePhotoNudgeChange: (direction: 'up' | 'right' | 'down' | 'left', value: number) => void
    onSaveSettingsProfile: (name: string) => { id: string; mode: 'created' | 'updated' } | null
    onLoadSettingsProfile: (profileId: string) => void
    onDeleteSettingsProfile: (profileId: string) => void
}

function NumericField({ controller }: { controller: NumericInputController }) {
    return (
        <Input
            value={controller.value}
            onBlur={controller.onBlur}
            onChange={(event) => controller.onChange(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    controller.onEnter()
                    event.currentTarget.blur()
                }
            }}
        />
    )
}

export function PrintSettingsPanel({
    paperId,
    layoutId,
    orientation,
    unit,
    layoutColumns,
    layoutRows,
    activePhoto,
    paperPresets,
    layoutPresets,
    settingsProfiles,
    widthInput,
    heightInput,
    marginInput,
    gapInput,
    onPaperIdChange,
    onLayoutChange,
    onOrientationChange,
    onUnitChange,
    onLayoutColumnsChange,
    onLayoutRowsChange,
    onActivePhotoRotate,
    onActivePhotoFitModeChange,
    onActivePhotoManualPositionEnabledChange,
    onActivePhotoNudgeChange,
    onSaveSettingsProfile,
    onLoadSettingsProfile,
    onDeleteSettingsProfile
}: PrintSettingsPanelProps) {
    const { t } = useTranslation()

    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>{t('settings.title')}</CardTitle>
                <CardDescription>{t('settings.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>{t('settings.paperSize')}</Label>
                    <Select value={paperId} onValueChange={onPaperIdChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {paperPresets.map((paperPreset) => (
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
                    <Select value={layoutId} onValueChange={onLayoutChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {layoutPresets.map((layoutPreset) => (
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
                            value={orientation}
                            onValueChange={(nextValue) =>
                                onOrientationChange(nextValue as Orientation)
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
                            value={unit}
                            onValueChange={(nextValue) => onUnitChange(nextValue as Unit)}
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
                            value={layoutColumns}
                            onChange={(event) => onLayoutColumnsChange(Number(event.target.value))}
                        />
                        <Input
                            type="number"
                            min={1}
                            step="1"
                            value={layoutRows}
                            onChange={(event) => onLayoutRowsChange(Number(event.target.value))}
                        />
                    </div>
                    <div className="text-muted-foreground text-xs">{t('settings.columnsRows')}</div>
                </div>

                <div className="space-y-2">
                    <Label>{t('settings.exactPrintSize', { unit })}</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericField controller={widthInput} />
                        <NumericField controller={heightInput} />
                    </div>
                    <div className="text-muted-foreground text-xs">{t('settings.widthHeight')}</div>
                </div>

                <div className="space-y-2">
                    <Label>{t('settings.pageSpacing', { unit })}</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericField controller={marginInput} />
                        <NumericField controller={gapInput} />
                    </div>
                    <div className="text-muted-foreground text-xs">{t('settings.marginGap')}</div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>{t('settings.selectedPhotoControls')}</Label>
                    {activePhoto ? (
                        <>
                            <div className="text-muted-foreground truncate text-xs">
                                {activePhoto.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onActivePhotoRotate(-90)}
                                >
                                    {t('settings.rotateMinus')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onActivePhotoRotate(90)}
                                >
                                    {t('settings.rotatePlus')}
                                </Button>
                            </div>
                            <Select
                                value={activePhoto.fitMode}
                                onValueChange={(nextValue) =>
                                    onActivePhotoFitModeChange(nextValue as FitMode)
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
                                        checked={activePhoto.manualPositionEnabled}
                                        onCheckedChange={onActivePhotoManualPositionEnabledChange}
                                    />
                                </div>

                                {activePhoto.manualPositionEnabled ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">{t('settings.moveUp')}</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.5"
                                                value={activePhoto.nudgeUpPct}
                                                onChange={(event) =>
                                                    onActivePhotoNudgeChange(
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
                                                value={activePhoto.nudgeRightPct}
                                                onChange={(event) =>
                                                    onActivePhotoNudgeChange(
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
                                                value={activePhoto.nudgeDownPct}
                                                onChange={(event) =>
                                                    onActivePhotoNudgeChange(
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
                                                value={activePhoto.nudgeLeftPct}
                                                onChange={(event) =>
                                                    onActivePhotoNudgeChange(
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
                    profiles={settingsProfiles}
                    onSaveProfile={onSaveSettingsProfile}
                    onLoadProfile={onLoadSettingsProfile}
                    onDeleteProfile={onDeleteSettingsProfile}
                />
            </CardContent>
        </Card>
    )
}
