import type { Metadata } from 'next'

import { StreamOverview } from '@/components/features/stream/overview/StreamOverview'

import { findChannelByUsername } from '@/utils/find-channel'
import { getMediaSource } from '@/utils/get-media-source'

export async function generateMetadata(props: {
	params: Promise<{ username: string }>
}): Promise<Metadata> {
	const { username } = await props.params
	const channel = await findChannelByUsername(username)

	return {
		title: `${channel.displayName} — Live`,
		description: channel.bio ?? channel.displayName,
		openGraph: {
			images: [{ url: getMediaSource(channel.avatar), alt: channel.displayName }]
		}
	}
}

export default async function ChannelLivePage(props: {
	params: Promise<{ username: string }>
}) {
	const { username } = await props.params
	const channel = await findChannelByUsername(username)

	return <StreamOverview channel={channel} />
}
