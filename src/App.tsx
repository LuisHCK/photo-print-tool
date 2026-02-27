import { Button } from '@/components/ui/button'
import { PhotosPanel } from '@/components/panels/photos-panel'
import { PreviewPanel } from '@/components/panels/preview-panel'
import { PrintSettingsPanel } from '@/components/panels/print-settings-panel'
import { PrintPages } from '@/components/print/print-pages'
import { usePrintJob } from '@/hooks/use-print-job'

function App() {
    const { state, actions } = usePrintJob()

    function printNow() {
        window.print()
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="no-print flex items-center justify-between border-b bg-card px-6 py-3">
                <div>
                    <h1 className="text-lg font-semibold">Photo Print Tool</h1>
                    <p className="text-muted-foreground text-sm">
                        Professional print workflow for daily photo jobs
                    </p>
                </div>
                <Button onClick={printNow}>Print</Button>
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
