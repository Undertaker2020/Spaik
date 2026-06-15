import type { Metadata } from 'next'

import { SponsorshipSuccess } from '@/components/features/sponsorship/SponsorshipSuccess'

import { NO_INDEX_PAGE } from '@/libs/constants/seo.constants'

export const metadata: Metadata = {
	title: 'Payment successful',
	...NO_INDEX_PAGE
}

export default async function SuccessPage(props: {
	searchParams: Promise<{ price?: string; username?: string }>
}) {
	const { price, username } = await props.searchParams

	return <SponsorshipSuccess plan={price} username={username} />
}
