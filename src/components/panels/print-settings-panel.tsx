import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PrintSettingsGuidesAlignmentCategory } from '@/components/panels/print-settings/print-settings-guides-alignment-category'
import { PrintSettingsLayoutCategory } from '@/components/panels/print-settings/print-settings-layout-category'
import { PrintSettingsSection } from '@/components/panels/print-settings/print-settings-section'
import { PrintSettingsSelectedPhotoCategory } from '@/components/panels/print-settings/print-settings-selected-photo-category'
import { PrintSettingsSizeSpacingCategory } from '@/components/panels/print-settings/print-settings-size-spacing-category'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { useTranslation } from 'react-i18next'

export function PrintSettingsPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()

    const hasPhotos = state.photos.length > 0

    if (!hasPhotos) {
        return (
            <Card className="relative z-10 overflow-hidden py-4">
                <CardHeader>
                    <CardTitle>{t('settings.title')}</CardTitle>
                    <CardDescription>{t('settings.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-sm">
                        <p>{t('settings.uploadFirst') || 'Upload photos to get started'}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="relative z-10 overflow-hidden py-4 xl:h-full">
            <CardHeader className="shrink-0">
                <CardTitle>{t('settings.title')}</CardTitle>
                <CardDescription>{t('settings.description')}</CardDescription>
            </CardHeader>
            <ScrollArea className="min-h-0 flex-1">
                <CardContent className="space-y-3 pb-6">
                    <PrintSettingsSection
                        title={t('settings.categories.layout')}
                        open={state.openSections.layout}
                        onToggle={() =>
                            actions.setSectionOpen('layout', !state.openSections.layout)
                        }
                    >
                        <PrintSettingsLayoutCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.sizeAndSpacing')}
                        open={state.openSections.sizeAndSpacing}
                        onToggle={() =>
                            actions.setSectionOpen(
                                'sizeAndSpacing',
                                !state.openSections.sizeAndSpacing
                            )
                        }
                    >
                        <PrintSettingsSizeSpacingCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.guidesAndAlignment')}
                        open={state.openSections.guidesAndAlignment}
                        onToggle={() =>
                            actions.setSectionOpen(
                                'guidesAndAlignment',
                                !state.openSections.guidesAndAlignment
                            )
                        }
                    >
                        <PrintSettingsGuidesAlignmentCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.selectedPhoto') || 'Selected Photo'}
                        open={state.openSections.selectedPhoto}
                        onToggle={() =>
                            actions.setSectionOpen(
                                'selectedPhoto',
                                !state.openSections.selectedPhoto
                            )
                        }
                    >
                        <PrintSettingsSelectedPhotoCategory />
                    </PrintSettingsSection>

                </CardContent>
            </ScrollArea>
        </Card>
    )
}
