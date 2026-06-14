'use client'

import { Play, Radio } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { AboutChannel } from '@/components/features/stream/overview/info/AboutChannel'
import { FollowButton } from '@/components/features/stream/overview/info/FollowButton'
import { ChannelVideos } from '@/components/features/stream/recordings/ChannelVideos'
import { ChannelAvatar } from '@/components/ui/elements/ChannelAvatar'
import { ChannelVerified } from '@/components/ui/elements/ChannelVerified'

import {
	type FindChannelByUsernameQuery,
	useFindFollowersCountByChannelQuery
} from '@/graphql/generated/output'

import { getMediaSource } from '@/utils/get-media-source'
import { cn } from '@/utils/tw-merge'

const TABS = ['Home', 'About', 'Videos'] as const
type Tab = (typeof TABS)[number]

interface ChannelHomeProps {
	channel: FindChannelByUsernameQuery['findChannelByUsername']
}

export function ChannelHome({ channel }: ChannelHomeProps) {
	const [tab, setTab] = useState<Tab>('Home')

	const isLive = channel.stream?.isLive ?? false
	const thumbnail = channel.stream?.thumbnailUrl

	const { data: followersData } = useFindFollowersCountByChannelQuery({
		variables: { channelId: channel.id }
	})
	const followers = followersData?.findFollowersCountByChannel ?? 0

	return (
		<div className='mx-auto max-w-screen-xl'>
			{/* Banner */}
			<div className='h-40 w-full rounded-xl bg-gradient-to-br from-[#0d2b3e] via-[#1a0d2b] to-[#2b1a0d]' />

			{/* Header (avatar overlaps the banner) */}
			<div className='-mt-8 flex items-end justify-between gap-4 px-4'>
				<div className='flex items-end gap-4'>
					<ChannelAvatar channel={channel} size='xl' isLive={isLive} />
					<div className='pb-1'>
						<div className='flex items-center gap-x-2'>
							<h1 className='text-2xl font-bold'>{channel.displayName}</h1>
							{channel.isVerified && <ChannelVerified />}
						</div>
						<p className='text-sm text-muted-foreground'>
							{new Intl.NumberFormat().format(followers)} followers
						</p>
					</div>
				</div>
				<div className='pb-1'>
					<FollowButton channel={channel} />
				</div>
			</div>

			{/* Tabs */}
			<div className='mt-4 flex gap-x-6 border-b px-4'>
				{TABS.map(t => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={cn(
							'relative py-3 text-sm font-semibold transition-colors',
							tab === t
								? 'text-[#18B9AE]'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						{t}
						{tab === t && (
							<span className='absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#18B9AE]' />
						)}
					</button>
				))}
			</div>

			{/* Content */}
			<div className='px-4 py-6'>
				{tab === 'Home' && (
					<div className='space-y-8'>
						<Link
							href={`/${channel.username}/live`}
							className='group relative block aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-muted'
						>
							{thumbnail ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={getMediaSource(thumbnail)}
									alt={channel.stream?.title ?? channel.displayName}
									className='size-full object-cover'
								/>
							) : (
								<div className='size-full bg-gradient-to-br from-[#0d2b3e] to-[#1a0d2b]' />
							)}
							<div className='absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/50' />

							<div className='absolute left-3 top-3'>
								{isLive ? (
									<span className='flex items-center gap-x-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase text-white'>
										<Radio className='size-3' /> Live
									</span>
								) : (
									<span className='rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold uppercase text-muted-foreground'>
										Offline
									</span>
								)}
							</div>

							<div className='absolute inset-0 flex items-center justify-center'>
								<div className='flex size-16 items-center justify-center rounded-full bg-black/50 transition-transform group-hover:scale-110'>
									<Play className='size-7 fill-white text-white' />
								</div>
							</div>

							{channel.stream?.title && (
								<div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4'>
									<p className='font-medium text-white'>
										{channel.stream.title}
									</p>
								</div>
							)}
						</Link>

						<ChannelVideos channelId={channel.id} title='Recent broadcasts' limit={8} />
					</div>
				)}

				{tab === 'Videos' && (
					<ChannelVideos channelId={channel.id} title='Videos' showEmpty />
				)}

				{tab === 'About' && <AboutChannel channel={channel} />}
			</div>
		</div>
	)
}
