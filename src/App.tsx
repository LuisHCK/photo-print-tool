import { AppHeader } from '@/components/app-header'
import { PhotosPanel } from '@/components/panels/photos-panel'
import { PreviewPanel } from '@/components/panels/preview-panel'
import { PrintSettingsPanel } from '@/components/panels/print-settings-panel'
import { PrintPages } from '@/components/print/print-pages'
import { PrintJobProvider } from '@/context/print-job-provider'
import { NativePrintProvider } from '@/context/native-print-provider'
import { trackEvent } from '@/lib/analytics'

function App() {
    function handlePrint() {
        trackEvent('print')
        setTimeout(() => window.print(), 100)
    }

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col xl:h-dvh xl:overflow-hidden">
            <NativePrintProvider>
                <AppHeader onPrint={handlePrint} />

                <PrintJobProvider>
                    <main className="no-print grid grid-cols-1 gap-4 p-4 flex-1 min-h-0 xl:grid-cols-[320px_1fr_360px] xl:grid-rows-[1fr] xl:overflow-hidden">
                        <PhotosPanel />

                        <PreviewPanel />

                        <PrintSettingsPanel />
                    </main>

                    <PrintPages />
                </PrintJobProvider>
            </NativePrintProvider>
        </div>
    )
}

export default App
