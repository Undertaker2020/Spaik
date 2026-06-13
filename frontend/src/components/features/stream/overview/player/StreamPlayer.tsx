import {useTracks} from '@livekit/components-react'
import {RemoteParticipant, type RemoteTrackPublication, Track, VideoQuality} from 'livekit-client'
import {useEffect, useRef, useState} from 'react'
import {useEventListener} from 'usehooks-ts'

import {FullscreenControl} from '@/components/features/stream/overview/player/FullscreenControl'
import {QualityControl, type QualityKey} from '@/components/features/stream/overview/player/QualityControl'
import {VolumeControl} from '@/components/features/stream/overview/player/VolumeControl'

const QUALITY_MAP: Record<QualityKey, VideoQuality> = {
    '720p': VideoQuality.HIGH,
    '360p': VideoQuality.MEDIUM,
    '180p': VideoQuality.LOW,
}

interface StreamPlayerProps {
    participant: RemoteParticipant
}

export function StreamPlayer({participant}: StreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const [volume, setVolume] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [quality, setQuality] = useState<QualityKey>('720p')

    function onVolumeChange(value: number) {
        setVolume(+value)

        if (videoRef.current) {
            videoRef.current.muted = value === 0
            videoRef.current.volume = +value * 0.01
        }
    }

    function toggleMute() {
        const isMuted = volume === 0

        setVolume(isMuted ? 50 : 0)

        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            videoRef.current.volume = isMuted ? 0.5 : 0
        }
    }

    useEffect(() => {
        onVolumeChange(0)
    }, [])

    function toggleFullscreen() {
        if (isFullscreen) {
            document.exitFullscreen()
        } else if (wrapperRef.current) {
            wrapperRef.current.requestFullscreen()
        }
    }

    function handleFullscreenChange() {
        const isCurrentlyFullscreen = document.fullscreenElement !== null

        setIsFullscreen(isCurrentlyFullscreen)
    }

    useEventListener(
        'fullscreenchange' as keyof WindowEventMap,
        handleFullscreenChange
    )

    const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone])
        .filter(track => track.participant.identity === participant.identity)

    tracks.forEach(track => {
        if (videoRef.current) {
            track.publication.track?.attach(videoRef.current)
        }
    })

    const cameraPublication = tracks.find(t => t.source === Track.Source.Camera)
        ?.publication as RemoteTrackPublication | undefined

    // Pin the chosen simulcast layer.
    useEffect(() => {
        cameraPublication?.setVideoQuality?.(QUALITY_MAP[quality])
    }, [cameraPublication, quality])

    return (
        <div ref={wrapperRef} className='relative flex h-full w-full items-center justify-center bg-black'>
            <video ref={videoRef} className='h-full w-full object-contain'/>
            <div className='absolute top-0 h-full w-full opacity-0 hover:opacity-100'>
                <div className='absolute bottom-0 flex h-16 w-full items-center justify-between px-4'>
                    <VolumeControl
                        onToggle={toggleMute}
                        onChange={onVolumeChange}
                        value={volume}
                    />
                    <div className='flex items-center gap-2'>
                        <QualityControl value={quality} onChange={setQuality}/>
                        <FullscreenControl
                            isFullscreen={isFullscreen}
                            onToggle={toggleFullscreen}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
