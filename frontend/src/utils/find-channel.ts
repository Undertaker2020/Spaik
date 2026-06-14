import { notFound } from 'next/navigation'

import {
	FindChannelByUsernameDocument,
	type FindChannelByUsernameQuery
} from '@/graphql/generated/output'

import { GATEWAY_URL } from '@/libs/constants/url.constants'

// Server-side fetch of a channel by username (shared by the channel home and the
// watch page). Falls back to a 404 when the channel can't be loaded.
export async function findChannelByUsername(username: string) {
	try {
		const query = FindChannelByUsernameDocument.loc?.source.body

		const response = await fetch(GATEWAY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables: { username } }),
			next: { revalidate: 30 }
		})

		const data = await response.json()
		const channel = data?.data
			?.findChannelByUsername as FindChannelByUsernameQuery['findChannelByUsername']

		if (!channel) return notFound()

		return channel
	} catch {
		return notFound()
	}
}
