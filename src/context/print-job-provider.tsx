import type { ReactNode } from 'react'
import { PrintJobActionsContext, PrintJobStateContext } from '@/context/print-job-context'
import { usePrintJob } from '@/hooks/use-print-job'

export function PrintJobProvider({ children }: { children: ReactNode }) {
    const { state, actions } = usePrintJob()

    return (
        <PrintJobActionsContext.Provider value={actions}>
            <PrintJobStateContext.Provider value={state}>{children}</PrintJobStateContext.Provider>
        </PrintJobActionsContext.Provider>
    )
}