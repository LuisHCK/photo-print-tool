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
    return (
        <Card className="py-4">
            <CardHeader>
                <CardTitle>Print settings</CardTitle>
                <CardDescription>
                    Layout, exact size, units, and photo fit controls.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Paper size</Label>
                    <Select value={paperId} onValueChange={onPaperIdChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {paperPresets.map((paperPreset) => (
                                <SelectItem key={paperPreset.id} value={paperPreset.id}>
                                    {paperPreset.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Layout</Label>
                    <Select value={layoutId} onValueChange={onLayoutChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {layoutPresets.map((layoutPreset) => (
                                <SelectItem key={layoutPreset.id} value={layoutPreset.id}>
                                    {layoutPreset.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Orientation</Label>
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
                                <SelectItem value="portrait">Portrait</SelectItem>
                                <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Units</Label>
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
                    <Label>Copies per page</Label>
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
                    <div className="text-muted-foreground text-xs">Columns / Rows</div>
                </div>

                <div className="space-y-2">
                    <Label>Exact print size ({unit})</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericField controller={widthInput} />
                        <NumericField controller={heightInput} />
                    </div>
                    <div className="text-muted-foreground text-xs">Width / Height</div>
                </div>

                <div className="space-y-2">
                    <Label>Page spacing ({unit})</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericField controller={marginInput} />
                        <NumericField controller={gapInput} />
                    </div>
                    <div className="text-muted-foreground text-xs">Margin / Gap</div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Selected photo controls</Label>
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
                                    Rotate -90°
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onActivePhotoRotate(90)}
                                >
                                    Rotate +90°
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
                                    <SelectItem value="fill">Fill (crop)</SelectItem>
                                    <SelectItem value="fit">Fit (contain)</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="space-y-2 rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Manual image position</Label>
                                    <Switch
                                        checked={activePhoto.manualPositionEnabled}
                                        onCheckedChange={onActivePhotoManualPositionEnabledChange}
                                    />
                                </div>

                                {activePhoto.manualPositionEnabled ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Move Up (%)</Label>
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
                                            <Label className="text-xs">Move Right (%)</Label>
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
                                            <Label className="text-xs">Move Down (%)</Label>
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
                                            <Label className="text-xs">Move Left (%)</Label>
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
                            Pick a photo from the left panel to edit fit and rotation.
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
