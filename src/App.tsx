import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PhotosPanel } from '@/components/panels/photos-panel'
import { PreviewPanel } from '@/components/panels/preview-panel'
import { PrintSettingsPanel } from '@/components/panels/print-settings-panel'
import { PrintPages } from '@/components/print/print-pages'
import { usePrintJob } from '@/hooks/use-print-job'
import {
    SUPPORTED_LANGUAGES,
    getCurrentSupportedLanguage,
    type SupportedLanguage
} from '@/i18n'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

function App() {
    const { t, i18n } = useTranslation()
    const { state, actions } = usePrintJob()
    const currentLanguage = getCurrentSupportedLanguage()

    function printNow() {
        window.print()
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="no-print flex items-center justify-between border-b bg-card px-6 py-3">
                <div>
                    <h1 className="text-lg font-semibold">{t('app.title')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {t('app.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('app.language')}</Label>
                        <Select
                            value={currentLanguage}
                            onValueChange={(next) => i18n.changeLanguage(next as SupportedLanguage)}
                        >
                            <SelectTrigger className="w-[210px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_LANGUAGES.map((language) => (
                                    <SelectItem key={language} value={language}>
                                        {t(`app.languageOptions.${language}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={printNow}>{t('app.print')}</Button>
                </div>
            </header>

            <main className="no-print grid grid-cols-1 gap-4 p-4 xl:grid-cols-[320px_1fr_360px]">
                <PhotosPanel
                    photos={state.photos}
                    activePhotoId={state.activePhotoId}
                    onFileUpload={actions.handleFileUpload}
                    onSetActivePhotoId={actions.setActivePhotoId}
                    onTogglePhotoSelection={actions.togglePhotoSelection}
                    onRemovePhoto={actions.removePhoto}
                />

                <PreviewPanel
                    pages={state.pages}
                    pageIndex={state.pageIndex}
                    slotsPerPage={state.slotsPerPage}
                    currentPage={state.currentPage}
                    pageSize={state.pageSize}
                    previewScale={state.previewScale}
                    selectedLayoutColumns={state.selectedLayoutColumns}
                    cellWidthMm={state.cellWidthMm}
                    cellHeightMm={state.cellHeightMm}
                    gapMm={state.gapMm}
                    gridWidthMm={state.gridWidthMm}
                    gridHeightMm={state.gridHeightMm}
                    hasOverflow={state.hasOverflow}
                    ppiWarnings={state.ppiWarnings}
                    onPageIndexChange={actions.setPageIndex}
                />

                <PrintSettingsPanel
                    paperId={state.paperId}
                    layoutId={state.layoutId}
                    orientation={state.orientation}
                    unit={state.unit}
                    layoutColumns={state.selectedLayoutColumns}
                    layoutRows={state.selectedLayoutRows}
                    activePhoto={state.activePhoto}
                    paperPresets={state.paperPresets}
                    layoutPresets={state.layoutPresets}
                    settingsProfiles={state.settingsProfiles}
                    widthInput={state.widthInput}
                    heightInput={state.heightInput}
                    marginInput={state.marginInput}
                    gapInput={state.gapInput}
                    onPaperIdChange={actions.setPaperId}
                    onLayoutChange={actions.updateLayout}
                    onOrientationChange={actions.setOrientation}
                    onUnitChange={actions.updateUnit}
                    onLayoutColumnsChange={actions.updateLayoutColumns}
                    onLayoutRowsChange={actions.updateLayoutRows}
                    onActivePhotoRotate={actions.updateActivePhotoRotation}
                    onActivePhotoFitModeChange={actions.updateActivePhotoFitMode}
                    onActivePhotoManualPositionEnabledChange={
                        actions.updateActivePhotoManualPositionEnabled
                    }
                    onActivePhotoNudgeChange={actions.updateActivePhotoNudge}
                    onSaveSettingsProfile={actions.saveSettingsProfile}
                    onLoadSettingsProfile={actions.loadSettingsProfile}
                    onDeleteSettingsProfile={actions.deleteSettingsProfile}
                />
            </main>

            <PrintPages
                pages={state.pages}
                pageSize={state.pageSize}
                selectedLayoutColumns={state.selectedLayoutColumns}
                cellWidthMm={state.cellWidthMm}
                cellHeightMm={state.cellHeightMm}
                gapMm={state.gapMm}
                gridWidthMm={state.gridWidthMm}
                gridHeightMm={state.gridHeightMm}
            />
        </div>
    )
}

export default App
