import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePrintJobState } from '@/hooks/use-print-job-context'
import { useTranslation } from 'react-i18next'

export function PrintSettingsSpacingCategory() {
    const { t } = useTranslation()
    const state = usePrintJobState()

    return (
        <div className="space-y-4">
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
                <div className="text-muted-foreground text-xs">
                    {t('settings.marginHorizontalVerticalGap')}
                </div>
            </div>
        </div>
    )
}