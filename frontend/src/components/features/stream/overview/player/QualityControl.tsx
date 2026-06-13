'use client'

import {Check, Settings} from 'lucide-react'
import {useState} from 'react'

import {Button} from '@/components/ui/common/Button'

export type QualityKey = '720p' | '360p' | '180p'

export const QUALITY_OPTIONS: QualityKey[] = ['720p', '360p', '180p']

interface QualityControlProps {
    value: QualityKey
    onChange: (quality: QualityKey) => void
}

export function QualityControl({value, onChange}: QualityControlProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className='relative flex items-center'>
            {open && (
                <div className='absolute bottom-full right-0 mb-2 min-w-[110px] overflow-hidden rounded-md border border-white/10 bg-black/90'>
                    {QUALITY_OPTIONS.map(quality => (
                        <button
                            key={quality}
                            onClick={() => {
                                onChange(quality)
                                setOpen(false)
                            }}
                            className='flex w-full items-center justify-between gap-3 px-3 py-2 text-sm text-white hover:bg-white/10'
                        >
                            <span className={quality === value ? 'font-semibold text-[#18B9AE]' : ''}>
                                {quality}
                            </span>
                            {quality === value && <Check className='size-4 text-[#18B9AE]'/>}
                        </button>
                    ))}
                </div>
            )}
            <Button
                variant='ghost'
                size='icon'
                onClick={() => setOpen(o => !o)}
                className='text-white hover:bg-white/10'
            >
                <Settings className='size-6'/>
            </Button>
        </div>
    )
}
