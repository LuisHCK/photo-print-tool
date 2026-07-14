#!/usr/bin/env bun
import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCALES_DIR = resolve(import.meta.dir, '..', 'src', 'locales')
const SRC_DIR = resolve(import.meta.dir, '..', 'src')
type TranslationObject = { [key: string]: string | TranslationObject }
type Report = {
    missingFromAll: string[]
    missingFromLocale: Array<{ key: string; presentIn: string }>
    interpolationMismatch: string[]
}

function flattenKeys(obj: TranslationObject, prefix = ''): Map<string, string> {
    const result = new Map<string, string>()
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'string') {
            result.set(path, value)
        } else if (value && typeof value === 'object') {
            for (const [k, v] of flattenKeys(value as TranslationObject, path)) {
                result.set(k, v)
            }
        }
    }
    return result
}

function extractInterpolationVars(value: string): Set<string> {
    const vars = new Set<string>()
    const regex = /\{\{(\w+)\}\}/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(value)) !== null) {
        vars.add(match[1])
    }
    return vars
}

async function readTranslationFile(filePath: string): Promise<Map<string, string> | null> {
    try {
        const file = Bun.file(filePath)
        const content = await file.json() as TranslationObject
        return flattenKeys(content)
    } catch (err) {
        console.error(`  Failed to read ${filePath}: ${err}`)
        return null
    }
}

async function findTranslationKeysInCode(dir: string): Promise<Set<string>> {
    const keys = new Set<string>()
    const tRegex = /[^a-zA-Z]t\(['"`]([^'"`]+)['"`]\)/g

    async function walk(directory: string) {
        const entries = readdirSync(directory, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = resolve(directory, entry.name)
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === 'dist') continue
                await walk(fullPath)
            } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
                try {
                    const text = await Bun.file(fullPath).text()
                    let match: RegExpExecArray | null
                    while ((match = tRegex.exec(text)) !== null) {
                        // skip template literal expressions like ${option.value}
                        if (!match[1].includes('${')) {
                            keys.add(match[1])
                        }
                    }
                } catch { /* skip unreadable files */ }
            }
        }
    }

    await walk(dir)
    return keys
}

async function main() {
    const enPath = resolve(LOCALES_DIR, 'en-us.json')
    const esPath = resolve(LOCALES_DIR, 'es-latam.json')

    if (!statSync(enPath).isFile() || !statSync(esPath).isFile()) {
        console.error('Translation files not found in', LOCALES_DIR)
        process.exit(1)
    }

    const [enKeys, esKeys] = await Promise.all([readTranslationFile(enPath), readTranslationFile(esPath)])
    if (!enKeys || !esKeys) process.exit(1)

    const report: Report = {
        missingFromAll: [],
        missingFromLocale: [],
        interpolationMismatch: []
    }

    // ── 1. Missing keys between translation files ──

    const enOnly = [...enKeys.keys()].filter((k) => !esKeys.has(k))
    const esOnly = [...esKeys.keys()].filter((k) => !enKeys.has(k))

    for (const key of enOnly) report.missingFromLocale.push({ key, presentIn: 'en-us.json' })
    for (const key of esOnly) report.missingFromLocale.push({ key, presentIn: 'es-latam.json' })

    // ── 2. Interpolation variable mismatches ──

    for (const key of enKeys.keys()) {
        if (!esKeys.has(key)) continue

        const enVars = extractInterpolationVars(enKeys.get(key)!)
        const esVars = extractInterpolationVars(esKeys.get(key)!)

        if (enVars.size !== esVars.size || ![...enVars].every((v) => esVars.has(v))) {
            report.interpolationMismatch.push(key)
        }
    }

    // ── 3. Source code usage vs translation files ──

    const codeKeys = await findTranslationKeysInCode(SRC_DIR)
    const allTranslationKeys = new Set([...enKeys.keys(), ...esKeys.keys()])

    for (const key of codeKeys) {
        if (!allTranslationKeys.has(key)) {
            report.missingFromAll.push(key)
        }
    }

    // ── Output report as JSON to stdout ──

    console.log(JSON.stringify(report))

    const totalIssues = report.missingFromAll.length + report.missingFromLocale.length + report.interpolationMismatch.length
    if (totalIssues > 0) {
        process.exit(1)
    }
}

main()
