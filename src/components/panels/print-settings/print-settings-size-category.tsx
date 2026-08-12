import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePrintJobState } from '@/hooks/use-print-job-context'
import { useTranslation } from 'react-i18next'

export function PrintSettingsSizeCategory() {
    const { t } = useTranslation()
    const state = usePrintJobState()

    return (
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
    )
}
