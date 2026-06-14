'use client'

import { Clock, Play, Video } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/common/Dialog'
import { Skeleton } from '@/components/ui/common/Skeleton'

import {
	type FindRecordingsByChannelQuery,
	useFindRecordingsByChannelQuery
} from '@/graphql/generated/output'

import { getMediaSource } from '@/utils/get-media-source'
import { getRecordingSource } from '@/utils/get-recording-source'

type Recording = FindRecordingsByChannelQuery['findRecordingsByChannel'][number]

function formatDuration(seconds?: number | null) {
	if (!seconds) return null
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m}:${s.toString().padStart(2, '0')}`
}

interface ChannelVideosProps {
	channelId: string
}

export function ChannelVideos({ channelId }: ChannelVideosProps) {
	const { data, loading } = useFindRecordingsByChannelQuery({
		variables: { channelId },
		skip: !channelId
	})

	const [active, setActive] = useState<Recording | null>(null)

	const recordings = data?.findRecordingsByChannel ?? []

	if (!loading && recordings.length === 0) return null

	return (
		<section className='mx-auto mt-8 max-w-screen-xl'>
			<div className='mb-4 flex items-center gap-x-2'>
				<Video className='size-5 text-[#18B9AE]' />
				<h2 className='text-lg font-semibold'>Videos</h2>
			</div>

			{loading ? (
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className='aspect-video w-full rounded-lg' />
					))}
				</div>
			) : (
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
					{recordings.map(recording => {
						const duration = formatDuration(recording.duration)

						return (
							<button
								key={recording.id}
								onClick={() => setActive(recording)}
								className='group flex flex-col text-left'
							>
								<div className='relative aspect-video w-full overflow-hidden rounded-lg bg-muted'>
									{recording.thumbnailUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={getMediaSource(recording.thumbnailUrl)}
											alt={recording.title}
											className='size-full object-cover'
										/>
									) : (
										<div className='flex size-full items-center justify-center'>
											<Video className='size-8 text-muted-foreground' />
										</div>
									)}
									<div className='absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40'>
										<Play className='size-10 text-white opacity-0 transition-opacity group-hover:opacity-100' />
									</div>
									{duration && (
										<span className='absolute bottom-1.5 right-1.5 flex items-center gap-x-1 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white'>
											<Clock className='size-3' />
											{duration}
										</span>
									)}
								</div>
								<p className='mt-2 line-clamp-2 text-sm font-medium'>
									{recording.title}
								</p>
								<p className='text-xs text-muted-foreground'>
									{new Date(recording.createdAt).toLocaleDateString()}
								</p>
							</button>
						)
					})}
				</div>
			)}

			<Dialog open={!!active} onOpenChange={open => !open && setActive(null)}>
				<DialogContent className='max-w-3xl p-0'>
					<DialogTitle className='sr-only'>
						{active?.title ?? 'Recording'}
					</DialogTitle>
					{active && (
						// eslint-disable-next-line jsx-a11y/media-has-caption
						<video
							src={getRecordingSource(active.url)}
							controls
							autoPlay
							className='aspect-video w-full rounded-lg bg-black'
						/>
					)}
				</DialogContent>
			</Dialog>
		</section>
	)
}
