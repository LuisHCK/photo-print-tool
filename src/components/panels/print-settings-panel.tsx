import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PrintSettingsGuidesAlignmentCategory } from '@/components/panels/print-settings/print-settings-guides-alignment-category'
import { PrintSettingsLayoutCategory } from '@/components/panels/print-settings/print-settings-layout-category'
import { PrintSettingsSection } from '@/components/panels/print-settings/print-settings-section'
import { PrintSettingsSelectedPhotoCategory } from '@/components/panels/print-settings/print-settings-selected-photo-category'
import { PrintSettingsSizeCategory } from '@/components/panels/print-settings/print-settings-size-category'
import { PrintSettingsSpacingCategory } from '@/components/panels/print-settings/print-settings-spacing-category'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { Crosshair, Image as ImageIcon, LayoutGrid, Move, Ruler } from 'lucide-react'
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
                        icon={LayoutGrid}
                        open={state.openSections.layout}
                        onToggle={() =>
                            actions.setSectionOpen('layout', !state.openSections.layout)
                        }
                    >
                        <PrintSettingsLayoutCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.size')}
                        icon={Ruler}
                        open={state.openSections.size}
                        onToggle={() =>
                            actions.setSectionOpen('size', !state.openSections.size)
                        }
                    >
                        <PrintSettingsSizeCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.selectedPhoto') || 'Selected Photo'}
                        icon={ImageIcon}
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

                    <PrintSettingsSection
                        title={t('settings.categories.guidesAndAlignment')}
                        icon={Crosshair}
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
                        title={t('settings.categories.spacing')}
                        icon={Move}
                        open={state.openSections.spacing}
                        onToggle={() =>
                            actions.setSectionOpen('spacing', !state.openSections.spacing)
                        }
                    >
                        <PrintSettingsSpacingCategory />
                    </PrintSettingsSection>

                </CardContent>
            </ScrollArea>
        </Card>
    )
}
