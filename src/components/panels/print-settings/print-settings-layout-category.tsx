import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { PRINT_SIZE_PRESETS } from '@/lib/print-sizes'
import type { Orientation, PrintSizeId, Unit } from '@/types/print'
import { useTranslation } from 'react-i18next'

const PRESET_PREFIX = 'preset:'

function isCustomPresetValue(value: string) {
    return value.startsWith(PRESET_PREFIX)
}

function presetValueFromId(id: string) {
    return `${PRESET_PREFIX}${id}`
}

function presetIdFromValue(value: string) {
    return value.slice(PRESET_PREFIX.length)
}

export function PrintSettingsLayoutCategory() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()
    const [showManage, setShowManage] = useState(false)
    const [presetName, setPresetName] = useState('')
    const [presetToDelete, setPresetToDelete] = useState<string | null>(null)

    function handlePrintSizeChange(nextValue: string) {
        if (isCustomPresetValue(nextValue)) {
            actions.loadCustomPreset(presetIdFromValue(nextValue))
            return
        }
        actions.setPrintSizeId(nextValue as PrintSizeId)
    }

    function handleSavePreset() {
        const trimmed = presetName.trim()
        if (!trimmed) return
        actions.saveCustomPreset(trimmed)
        setPresetName('')
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>{t('settings.printSize') || 'Print size'}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowManage((v) => !v)}>
                        {showManage ? t('settings.done') || 'Done' : t('settings.manage') || 'Manage'}
                    </Button>
                </div>
                <Select value={state.printSizeId} onValueChange={handlePrintSizeChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PRINT_SIZE_PRESETS.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                                {preset.name}
                            </SelectItem>
                        ))}
                        {state.customPresets.length > 0 ? (
                            <>
                                <SelectSeparator />
                                <SelectGroup>
                                    <SelectLabel>{t('settings.savedPresets') || 'Saved presets'}</SelectLabel>
                                    {state.customPresets.map((preset) => (
                                        <SelectItem key={preset.id} value={presetValueFromId(preset.id)}>
                                            {preset.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </>
                        ) : null}
                    </SelectContent>
                </Select>
            </div>

            {showManage ? (
                <div className="space-y-3 rounded-md border p-3">
                    <div className="flex gap-2">
                        <Input
                            value={presetName}
                            onChange={(event) => setPresetName(event.target.value)}
                            placeholder={t('settings.presetNamePlaceholder') || 'Preset name'}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleSavePreset()
                                }
                            }}
                        />
                        <Button type="button" size="sm" onClick={handleSavePreset}>
                            {t('settings.savePreset') || 'Save'}
                        </Button>
                    </div>

                    {state.customPresets.length > 0 ? (
                        <div className="space-y-1">
                            {state.customPresets.map((preset) => (
                                <div key={preset.id} className="flex items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent">
                                    <button
                                        type="button"
                                        className="flex-1 text-left"
                                        onClick={() => actions.loadCustomPreset(preset.id)}
                                    >
                                        {preset.name}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-destructive ml-2 size-5 shrink-0 rounded"
                                        onClick={() => setPresetToDelete(preset.id)}
                                        aria-label={t('settings.deletePreset') || 'Delete'}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <ConfirmDialog
                        open={presetToDelete !== null}
                        onOpenChange={(open) => {
                            if (!open) setPresetToDelete(null)
                        }}
                        onConfirm={() => {
                            if (presetToDelete) {
                                actions.deleteCustomPreset(presetToDelete)
                                setPresetToDelete(null)
                            }
                        }}
                        title={t('settings.confirmDeletePresetTitle') || 'Delete preset'}
                        description={t('settings.confirmDeletePresetDescription') || 'This preset will be permanently removed.'}
                        confirmLabel={t('settings.deletePreset') || 'Delete'}
                        variant="destructive"
                    />
                </div>
            ) : null}

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
                        onValueChange={(nextValue) => actions.setOrientation(nextValue as Orientation)}
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
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        type="number"
                        min={1}
                        step="1"
                        value={state.selectedLayoutColumns}
                        onChange={(event) => actions.updateLayoutColumns(Number(event.target.value))}
                    />
                    <Input
                        type="number"
                        min={1}
                        step="1"
                        value={state.selectedLayoutRows}
                        onChange={(event) => actions.updateLayoutRows(Number(event.target.value))}
                    />
                    <Input
                        type="number"
                        min={1}
                        max={state.selectedLayoutColumns * state.selectedLayoutRows}
                        step="1"
                        value={state.maxCopiesPerPage}
                        onChange={(event) => actions.setMaxCopiesPerPage(Number(event.target.value))}
                    />
                </div>
                <div className="text-muted-foreground text-xs">
                    {t('settings.columnsRowsMaxCopies')}
                </div>
            </div>
        </div>
    )
}
