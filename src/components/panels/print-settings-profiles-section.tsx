import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import type { PrintSettingsProfile } from '@/types/print'
import { useTranslation } from 'react-i18next'

interface PrintSettingsProfilesSectionProps {
    profiles: PrintSettingsProfile[]
    onSaveProfile: (name: string) => { id: string; mode: 'created' | 'updated' } | null
    onLoadProfile: (profileId: string) => void
    onDeleteProfile: (profileId: string) => void
}

export function PrintSettingsProfilesSection({
    profiles,
    onSaveProfile,
    onLoadProfile,
    onDeleteProfile
}: PrintSettingsProfilesSectionProps) {
    const [expanded, setExpanded] = useState(false)
    const [profileName, setProfileName] = useState('')
    const [selectedProfileId, setSelectedProfileId] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const { t } = useTranslation()

    const selectedProfile = useMemo(
        () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
        [profiles, selectedProfileId]
    )

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{t('profiles.title')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? t('profiles.hide') : t('profiles.manage')}
                </Button>
            </div>

            {expanded ? (
                <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-2">
                        <Label className="text-xs">{t('profiles.saveCurrent')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={profileName}
                                onChange={(event) => setProfileName(event.target.value)}
                                placeholder={t('profiles.profileNamePlaceholder')}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const result = onSaveProfile(profileName)
                                    if (!result) {
                                        setError(t('profiles.errorInvalidName'))
                                        setNotice('')
                                        return
                                    }

                                    setError('')
                                    setNotice(
                                        result.mode === 'created'
                                            ? t('profiles.noticeSaved')
                                            : t('profiles.noticeUpdated')
                                    )
                                    setSelectedProfileId(result.id)
                                    setProfileName('')
                                }}
                            >
                                {t('profiles.save')}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">{t('profiles.savedProfiles')}</Label>
                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('profiles.selectProfile')} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                        {profile.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!selectedProfile}
                            onClick={() => {
                                if (!selectedProfile) {
                                    return
                                }

                                onLoadProfile(selectedProfile.id)
                                setError('')
                                setNotice(t('profiles.noticeLoaded'))
                            }}
                        >
                            {t('profiles.load')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={!selectedProfile}
                            onClick={() => {
                                if (!selectedProfile) {
                                    return
                                }

                                onDeleteProfile(selectedProfile.id)
                                setSelectedProfileId('')
                                setError('')
                                setNotice(t('profiles.noticeDeleted'))
                            }}
                        >
                            {t('profiles.delete')}
                        </Button>
                    </div>

                    {notice ? <p className="text-muted-foreground text-xs">{notice}</p> : null}
                    {error ? <p className="text-destructive text-xs">{error}</p> : null}
                </div>
            ) : null}
        </div>
    )
}
