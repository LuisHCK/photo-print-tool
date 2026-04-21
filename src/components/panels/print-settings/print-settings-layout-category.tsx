import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import type { Orientation, Unit } from '@/types/print'
import { useTranslation } from 'react-i18next'

export function PrintSettingsLayoutCategory() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()

    return (
        <div className="space-y-4">
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