import { AppHeader } from '@/components/app-header'
import { PhotosPanel } from '@/components/panels/photos-panel'
import { PreviewPanel } from '@/components/panels/preview-panel'
import { PrintSettingsPanel } from '@/components/panels/print-settings-panel'
import { PrintPages } from '@/components/print/print-pages'
import { PrintJobProvider } from '@/context/print-job-provider'

function App() {
    function printNow() {
        window.print()
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <AppHeader onPrint={printNow} />

            <PrintJobProvider>
                <main className="no-print grid items-start grid-cols-1 gap-4 p-4 xl:grid-cols-[320px_1fr_360px]">
                    <PhotosPanel />

                    <PreviewPanel />

                    <PrintSettingsPanel />
                </main>

                <PrintPages />
            </PrintJobProvider>
        </div>
    )
}

export default App
