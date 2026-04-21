import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PrintSettingsProfilesSection } from '@/components/panels/print-settings-profiles-section'
import { PrintSettingsGuidesAlignmentCategory } from '@/components/panels/print-settings/print-settings-guides-alignment-category'
import { PrintSettingsLayoutCategory } from '@/components/panels/print-settings/print-settings-layout-category'
import { PrintSettingsSection } from '@/components/panels/print-settings/print-settings-section'
import { PrintSettingsSelectedPhotoCategory } from '@/components/panels/print-settings/print-settings-selected-photo-category'
import { PrintSettingsSizeSpacingCategory } from '@/components/panels/print-settings/print-settings-size-spacing-category'
import { usePrintJobActions, usePrintJobState } from '@/hooks/use-print-job-context'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type SettingsSectionId =
    | 'layout'
    | 'sizeAndSpacing'
    | 'guidesAndAlignment'
    | 'selectedPhoto'
    | 'profiles'

export function PrintSettingsPanel() {
    const { t } = useTranslation()
    const state = usePrintJobState()
    const actions = usePrintJobActions()
    const [openSections, setOpenSections] = useState<Record<SettingsSectionId, boolean>>({
        layout: false,
        sizeAndSpacing: false,
        guidesAndAlignment: false,
        selectedPhoto: false,
        profiles: false
    })

    function toggleSection(sectionId: SettingsSectionId) {
        setOpenSections((previous) => ({
            ...previous,
            [sectionId]: !previous[sectionId]
        }))
    }

    return (
        <Card className="relative z-10 self-start overflow-hidden py-4 max-h-screen xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
            <CardHeader className="shrink-0">
                <CardTitle>{t('settings.title')}</CardTitle>
                <CardDescription>{t('settings.description')}</CardDescription>
            </CardHeader>
            <ScrollArea className="min-h-0 flex-1">
                <CardContent className="space-y-3 pb-6">
                    <PrintSettingsSection
                        title={t('settings.categories.layout')}
                        open={openSections.layout}
                        onToggle={() => toggleSection('layout')}
                    >
                        <PrintSettingsLayoutCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.sizeAndSpacing')}
                        open={openSections.sizeAndSpacing}
                        onToggle={() => toggleSection('sizeAndSpacing')}
                    >
                        <PrintSettingsSizeSpacingCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.guidesAndAlignment')}
                        open={openSections.guidesAndAlignment}
                        onToggle={() => toggleSection('guidesAndAlignment')}
                    >
                        <PrintSettingsGuidesAlignmentCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.selectedPhoto')}
                        open={openSections.selectedPhoto}
                        onToggle={() => toggleSection('selectedPhoto')}
                    >
                        <PrintSettingsSelectedPhotoCategory />
                    </PrintSettingsSection>

                    <PrintSettingsSection
                        title={t('settings.categories.profiles')}
                        open={openSections.profiles}
                        onToggle={() => toggleSection('profiles')}
                    >
                        <PrintSettingsProfilesSection
                            profiles={state.settingsProfiles}
                            onSaveProfile={actions.saveSettingsProfile}
                            onLoadProfile={actions.loadSettingsProfile}
                            onDeleteProfile={actions.deleteSettingsProfile}
                        />
                    </PrintSettingsSection>
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
