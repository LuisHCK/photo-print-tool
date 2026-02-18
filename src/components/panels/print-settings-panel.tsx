import { useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LAYOUT_PRESETS } from '@/lib/layout-presets'
import { PAPER_PRESETS } from '@/lib/paper-presets'
import type {
    LayoutPresetDraft,
    NumericInputController,
    PaperPresetDraft
} from '@/hooks/use-print-job'
import type {
    FitMode,
    LayoutPreset,
    LayoutPresetId,
    Orientation,
    PaperPreset,
    PaperPresetId,
    PhotoItem,
    Unit
} from '@/types/print'

interface PrintSettingsPanelProps {
    paperId: PaperPresetId
    layoutId: LayoutPresetId
    orientation: Orientation
    unit: Unit
    activePhoto: PhotoItem | null
    paperPresets: PaperPreset[]
    layoutPresets: LayoutPreset[]
    customPaperPresets: PaperPreset[]
    customLayoutPresets: LayoutPreset[]
    widthInput: NumericInputController
    heightInput: NumericInputController
    marginInput: NumericInputController
    gapInput: NumericInputController
    onPaperIdChange: (paperId: PaperPresetId) => void
    onLayoutChange: (layoutId: LayoutPresetId) => void
    onOrientationChange: (orientation: Orientation) => void
    onUnitChange: (unit: Unit) => void
    onActivePhotoRotate: (delta: number) => void
    onActivePhotoFitModeChange: (fitMode: FitMode) => void
    onSaveCustomPaperPreset: (draft: PaperPresetDraft) => PaperPresetId | null
    onDeleteCustomPaperPreset: (presetId: PaperPresetId) => void
    onDuplicatePaperPreset: (sourcePresetId: PaperPresetId) => PaperPresetId | null
    onSaveCustomLayoutPreset: (draft: LayoutPresetDraft) => LayoutPresetId | null
    onDeleteCustomLayoutPreset: (presetId: LayoutPresetId) => void
    onDuplicateLayoutPreset: (sourcePresetId: LayoutPresetId) => LayoutPresetId | null
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
    activePhoto,
    paperPresets,
    layoutPresets,
    customPaperPresets,
    customLayoutPresets,
    widthInput,
    heightInput,
    marginInput,
    gapInput,
    onPaperIdChange,
    onLayoutChange,
    onOrientationChange,
    onUnitChange,
    onActivePhotoRotate,
    onActivePhotoFitModeChange,
    onSaveCustomPaperPreset,
    onDeleteCustomPaperPreset,
    onDuplicatePaperPreset,
    onSaveCustomLayoutPreset,
    onDeleteCustomLayoutPreset,
    onDuplicateLayoutPreset
}: PrintSettingsPanelProps) {
    const [selectedCustomPaperId, setSelectedCustomPaperId] = useState<PaperPresetId>('')
    const [selectedCustomLayoutId, setSelectedCustomLayoutId] = useState<LayoutPresetId>('')
    const [paperSourceId, setPaperSourceId] = useState<PaperPresetId>(PAPER_PRESETS[0].id)
    const [layoutSourceId, setLayoutSourceId] = useState<LayoutPresetId>(LAYOUT_PRESETS[0].id)

    const [paperName, setPaperName] = useState('')
    const [paperWidthMm, setPaperWidthMm] = useState('210')
    const [paperHeightMm, setPaperHeightMm] = useState('297')
    const [paperError, setPaperError] = useState('')
    const [paperNotice, setPaperNotice] = useState('')
    const [pendingDeletePaperId, setPendingDeletePaperId] = useState<PaperPresetId | null>(null)

    const [layoutName, setLayoutName] = useState('')
    const [layoutColumns, setLayoutColumns] = useState('2')
    const [layoutRows, setLayoutRows] = useState('2')
    const [layoutCellWidthMm, setLayoutCellWidthMm] = useState('89')
    const [layoutCellHeightMm, setLayoutCellHeightMm] = useState('127')
    const [layoutSupportsAutoFlow, setLayoutSupportsAutoFlow] = useState(true)
    const [layoutRepeatSinglePhoto, setLayoutRepeatSinglePhoto] = useState(false)
    const [layoutError, setLayoutError] = useState('')
    const [layoutNotice, setLayoutNotice] = useState('')
    const [pendingDeleteLayoutId, setPendingDeleteLayoutId] = useState<LayoutPresetId | null>(null)

    function showPaperNotice(message: string) {
        setPaperNotice(message)
        window.setTimeout(() => setPaperNotice(''), 1800)
    }

    function showLayoutNotice(message: string) {
        setLayoutNotice(message)
        window.setTimeout(() => setLayoutNotice(''), 1800)
    }

    function selectCustomPaperPreset(presetId: PaperPresetId) {
        setSelectedCustomPaperId(presetId)

        const target = customPaperPresets.find((preset) => preset.id === presetId)
        if (!target) {
            return
        }

        setPaperName(target.name)
        setPaperWidthMm(String(target.widthMm))
        setPaperHeightMm(String(target.heightMm))
        setPaperError('')
    }

    function selectCustomLayoutPreset(presetId: LayoutPresetId) {
        setSelectedCustomLayoutId(presetId)

        const target = customLayoutPresets.find((preset) => preset.id === presetId)
        if (!target) {
            return
        }

        setLayoutName(target.name)
        setLayoutColumns(String(target.columns))
        setLayoutRows(String(target.rows))
        setLayoutCellWidthMm(String(target.defaultCellWidthMm))
        setLayoutCellHeightMm(String(target.defaultCellHeightMm))
        setLayoutSupportsAutoFlow(target.supportsAutoFlow)
        setLayoutRepeatSinglePhoto(target.repeatSinglePhoto)
        setLayoutError('')
    }

    function resetPaperForm() {
        setSelectedCustomPaperId('')
        setPaperName('')
        setPaperWidthMm('210')
        setPaperHeightMm('297')
        setPaperError('')
        setPaperNotice('')
        setPendingDeletePaperId(null)
    }

    function resetLayoutForm() {
        setSelectedCustomLayoutId('')
        setLayoutName('')
        setLayoutColumns('2')
        setLayoutRows('2')
        setLayoutCellWidthMm('89')
        setLayoutCellHeightMm('127')
        setLayoutSupportsAutoFlow(true)
        setLayoutRepeatSinglePhoto(false)
        setLayoutError('')
        setLayoutNotice('')
        setPendingDeleteLayoutId(null)
    }

    function savePaperPreset() {
        const nextId = onSaveCustomPaperPreset({
            id: selectedCustomPaperId || undefined,
            name: paperName,
            widthMm: Number(paperWidthMm),
            heightMm: Number(paperHeightMm)
        })

        if (!nextId) {
            setPaperError('Enter valid values (name, width, and height in mm).')
            setPaperNotice('')
            return
        }

        setSelectedCustomPaperId(nextId)
        setPaperError('')
        showPaperNotice(selectedCustomPaperId ? 'Paper preset updated.' : 'Paper preset created.')
    }

    function saveLayoutPreset() {
        const nextId = onSaveCustomLayoutPreset({
            id: selectedCustomLayoutId || undefined,
            name: layoutName,
            columns: Number(layoutColumns),
            rows: Number(layoutRows),
            defaultCellWidthMm: Number(layoutCellWidthMm),
            defaultCellHeightMm: Number(layoutCellHeightMm),
            supportsAutoFlow: layoutSupportsAutoFlow,
            repeatSinglePhoto: layoutRepeatSinglePhoto
        })

        if (!nextId) {
            setLayoutError('Enter valid values (name, rows/columns, and default size in mm).')
            setLayoutNotice('')
            return
        }

        setSelectedCustomLayoutId(nextId)
        setLayoutError('')
        showLayoutNotice(
            selectedCustomLayoutId ? 'Layout preset updated.' : 'Layout preset created.'
        )
    }

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

                <div className="space-y-3">
                    <Label>Custom presets</Label>
                    <Tabs defaultValue="paper">
                        <TabsList>
                            <TabsTrigger value="paper">Paper</TabsTrigger>
                            <TabsTrigger value="layout">Layout</TabsTrigger>
                        </TabsList>

                        <TabsContent value="paper" className="space-y-3 pt-2">
                            <div className="space-y-2">
                                <Label>Duplicate built-in paper</Label>
                                <div className="flex gap-2">
                                    <Select value={paperSourceId} onValueChange={setPaperSourceId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAPER_PRESETS.map((preset) => (
                                                <SelectItem key={preset.id} value={preset.id}>
                                                    {preset.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const nextId = onDuplicatePaperPreset(paperSourceId)
                                            if (nextId) {
                                                setSelectedCustomPaperId(nextId)
                                                setPaperError('')
                                                showPaperNotice('Paper preset duplicated.')
                                            }
                                        }}
                                    >
                                        Duplicate
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Edit custom paper</Label>
                                <Select
                                    value={selectedCustomPaperId}
                                    onValueChange={selectCustomPaperPreset}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select custom paper preset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customPaperPresets.map((preset) => (
                                            <SelectItem key={preset.id} value={preset.id}>
                                                {preset.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <Input
                                    placeholder="Preset name"
                                    value={paperName}
                                    onChange={(event) => setPaperName(event.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Width (mm)"
                                        value={paperWidthMm}
                                        onChange={(event) => setPaperWidthMm(event.target.value)}
                                    />
                                    <Input
                                        placeholder="Height (mm)"
                                        value={paperHeightMm}
                                        onChange={(event) => setPaperHeightMm(event.target.value)}
                                    />
                                </div>
                            </div>

                            {paperError ? (
                                <p className="text-destructive text-xs">{paperError}</p>
                            ) : null}
                            {paperNotice ? (
                                <p className="text-muted-foreground text-xs">{paperNotice}</p>
                            ) : null}

                            <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={savePaperPreset}>
                                    {selectedCustomPaperId ? 'Update' : 'Create'}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={resetPaperForm}
                                >
                                    New
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!selectedCustomPaperId}
                                    onClick={() => {
                                        if (!selectedCustomPaperId) {
                                            return
                                        }

                                        setPendingDeletePaperId(selectedCustomPaperId)
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>

                            {pendingDeletePaperId ? (
                                <div className="border-destructive/40 bg-destructive/5 space-y-2 rounded-md border p-2">
                                    <p className="text-destructive text-xs">
                                        Delete custom paper preset “
                                        {customPaperPresets.find(
                                            (preset) => preset.id === pendingDeletePaperId
                                        )?.name ?? pendingDeletePaperId}
                                        ”?
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                onDeleteCustomPaperPreset(pendingDeletePaperId)
                                                resetPaperForm()
                                                showPaperNotice('Paper preset deleted.')
                                            }}
                                        >
                                            Confirm delete
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setPendingDeletePaperId(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </TabsContent>

                        <TabsContent value="layout" className="space-y-3 pt-2">
                            <div className="space-y-2">
                                <Label>Duplicate built-in layout</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={layoutSourceId}
                                        onValueChange={setLayoutSourceId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LAYOUT_PRESETS.map((preset) => (
                                                <SelectItem key={preset.id} value={preset.id}>
                                                    {preset.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const nextId = onDuplicateLayoutPreset(layoutSourceId)
                                            if (nextId) {
                                                setSelectedCustomLayoutId(nextId)
                                                setLayoutError('')
                                                showLayoutNotice('Layout preset duplicated.')
                                            }
                                        }}
                                    >
                                        Duplicate
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Edit custom layout</Label>
                                <Select
                                    value={selectedCustomLayoutId}
                                    onValueChange={selectCustomLayoutPreset}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select custom layout preset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customLayoutPresets.map((preset) => (
                                            <SelectItem key={preset.id} value={preset.id}>
                                                {preset.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <Input
                                    placeholder="Preset name"
                                    value={layoutName}
                                    onChange={(event) => setLayoutName(event.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Columns"
                                        value={layoutColumns}
                                        onChange={(event) => setLayoutColumns(event.target.value)}
                                    />
                                    <Input
                                        placeholder="Rows"
                                        value={layoutRows}
                                        onChange={(event) => setLayoutRows(event.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Default width (mm)"
                                        value={layoutCellWidthMm}
                                        onChange={(event) =>
                                            setLayoutCellWidthMm(event.target.value)
                                        }
                                    />
                                    <Input
                                        placeholder="Default height (mm)"
                                        value={layoutCellHeightMm}
                                        onChange={(event) =>
                                            setLayoutCellHeightMm(event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-sm">
                                    <span>Supports auto flow</span>
                                    <Switch
                                        checked={layoutSupportsAutoFlow}
                                        onCheckedChange={setLayoutSupportsAutoFlow}
                                    />
                                </label>
                                <label className="flex items-center justify-between text-sm">
                                    <span>Repeat single photo</span>
                                    <Switch
                                        checked={layoutRepeatSinglePhoto}
                                        onCheckedChange={setLayoutRepeatSinglePhoto}
                                    />
                                </label>
                            </div>

                            {layoutError ? (
                                <p className="text-destructive text-xs">{layoutError}</p>
                            ) : null}
                            {layoutNotice ? (
                                <p className="text-muted-foreground text-xs">{layoutNotice}</p>
                            ) : null}

                            <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={saveLayoutPreset}>
                                    {selectedCustomLayoutId ? 'Update' : 'Create'}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={resetLayoutForm}
                                >
                                    New
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!selectedCustomLayoutId}
                                    onClick={() => {
                                        if (!selectedCustomLayoutId) {
                                            return
                                        }

                                        setPendingDeleteLayoutId(selectedCustomLayoutId)
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>

                            {pendingDeleteLayoutId ? (
                                <div className="border-destructive/40 bg-destructive/5 space-y-2 rounded-md border p-2">
                                    <p className="text-destructive text-xs">
                                        Delete custom layout preset “
                                        {customLayoutPresets.find(
                                            (preset) => preset.id === pendingDeleteLayoutId
                                        )?.name ?? pendingDeleteLayoutId}
                                        ”?
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                onDeleteCustomLayoutPreset(pendingDeleteLayoutId)
                                                resetLayoutForm()
                                                showLayoutNotice('Layout preset deleted.')
                                            }}
                                        >
                                            Confirm delete
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setPendingDeleteLayoutId(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </TabsContent>
                    </Tabs>
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
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Pick a photo from the left panel to edit fit and rotation.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
