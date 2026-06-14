'use client'

import { Clock, Play, Trash2, Video } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/common/Dialog'
import { Skeleton } from '@/components/ui/common/Skeleton'

import {
	type FindRecordingsByChannelQuery,
	useDeleteRecordingMutation,
	useFindRecordingsByChannelQuery
} from '@/graphql/generated/output'

import { useCurrent } from '@/hooks/useCurrent'

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
	const { data, loading, refetch } = useFindRecordingsByChannelQuery({
		variables: { channelId },
		skip: !channelId
	})

	const { user } = useCurrent()
	const isOwner = !!user && user.id === channelId

	const [active, setActive] = useState<Recording | null>(null)

	const [deleteRecording, { loading: deleting }] = useDeleteRecordingMutation({
		onCompleted() {
			refetch()
		},
		onError() {
			toast.error('Could not delete the video')
		}
	})

	function onDelete(recording: Recording) {
		if (!window.confirm(`Delete "${recording.title}"? This can't be undone.`)) return
		deleteRecording({ variables: { id: recording.id } })
	}

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
							<div
								key={recording.id}
								className='group relative flex flex-col'
							>
								<button
									onClick={() => setActive(recording)}
									className='relative aspect-video w-full overflow-hidden rounded-lg bg-muted text-left'
								>
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
								</button>

								{isOwner && (
									<button
										onClick={() => onDelete(recording)}
										disabled={deleting}
										aria-label='Delete video'
										className='absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50'
									>
										<Trash2 className='size-4' />
									</button>
								)}

								<p className='mt-2 line-clamp-2 text-sm font-medium'>
									{recording.title}
								</p>
								<p className='text-xs text-muted-foreground'>
									{new Date(recording.createdAt).toLocaleDateString()}
								</p>
							</div>
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
