'use client'

import {useTranslations} from 'next-intl'
import {useEffect, useState} from 'react'
import {toast} from 'sonner'

import {Heading} from '@/components/ui/elements/Heading'
import {ToggleCard, ToggleCardSkeleton} from '@/components/ui/elements/ToggleCard'

import {useChangeStreamRecordingMutation} from '@/graphql/generated/output'

import {useCurrent} from '@/hooks/useCurrent'
import {InstructionModal} from "@/components/features/keys/settings/InstructionModal";
import {CreateIngressForm} from "@/components/features/keys/settings/forms/CreateIngressForm";
import {StreamURL} from "@/components/features/keys/settings/forms/StreamURL";
import {StreamKey} from "@/components/features/keys/settings/forms/StreamKey";


export function KeysSettings() {
    const t = useTranslations('dashboard.keys.header')

    const {user, isLoadingProfile, refetch} = useCurrent()

    const [isRecording, setIsRecording] = useState(false)

    useEffect(() => {
        if (user?.stream) setIsRecording(user.stream.isRecordingEnabled)
    }, [user?.stream?.isRecordingEnabled])

    const [changeRecording, {loading: isLoadingRecording}] = useChangeStreamRecordingMutation({
        onCompleted() {
            refetch()
            toast.success('Recording setting updated')
        },
        onError() {
            toast.error('Failed to update the recording setting')
        }
    })

    function onToggleRecording(value: boolean) {
        setIsRecording(value)
        changeRecording({variables: {isEnabled: value}})
    }

    return (
        <div className='lg:px-10'>
            <div className='block items-center justify-between space-y-3 lg:flex lg:space-y-0'>
                <Heading
                    title={t('heading')}
                    description={t('description')}
                    size='lg'
                />
                <div className='flex items-center gap-x-4'>
                    <InstructionModal/>
                    <CreateIngressForm/>
                </div>
            </div>
            <div className='mt-5 space-y-6'>
                {isLoadingProfile ? (
                    Array.from({length: 2}).map((_, index) => (
                        <ToggleCardSkeleton key={index}/>
                    ))
                ) : (
                    <>
                        <StreamURL value={user?.stream?.serverUrl!}/>
                        <StreamKey value={user?.stream?.streamKey!}/>
                        <ToggleCard
                            heading='Record streams'
                            description='Save your live streams as videos on your channel.'
                            value={isRecording}
                            onChange={onToggleRecording}
                            isDisabled={isLoadingRecording}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
