import { createContext } from 'react'
import type { PrintJobActions, PrintJobState } from '@/hooks/use-print-job'

export const PrintJobStateContext = createContext<PrintJobState | null>(null)
export const PrintJobActionsContext = createContext<PrintJobActions | null>(null)