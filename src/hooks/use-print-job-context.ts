import { useContext } from 'react'
import { PrintJobActionsContext, PrintJobStateContext } from '@/context/print-job-context'

export function usePrintJobState() {
    const state = useContext(PrintJobStateContext)

    if (!state) {
        throw new Error('usePrintJobState must be used within a PrintJobProvider')
    }

    return state
}

export function usePrintJobActions() {
    const actions = useContext(PrintJobActionsContext)

    if (!actions) {
        throw new Error('usePrintJobActions must be used within a PrintJobProvider')
    }

    return actions
}

export function usePrintJobContext() {
    return {
        state: usePrintJobState(),
        actions: usePrintJobActions()
    }
}