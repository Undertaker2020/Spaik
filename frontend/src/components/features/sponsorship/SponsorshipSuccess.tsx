'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/common/Button'

interface SponsorshipSuccessProps {
	plan?: string
	username?: string
}

export function SponsorshipSuccess({ plan, username }: SponsorshipSuccessProps) {
	const router = useRouter()

	useEffect(() => {
		toast.success(
			username ? `You're now a sponsor of @${username}!` : 'You are now a sponsor!'
		)
	}, [username])

	return (
		<div className='mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center'>
			<CheckCircle2 className='size-16 text-[#18B9AE]' />
			<h1 className='text-2xl font-bold'>Payment successful</h1>
			<p className='text-muted-foreground'>
				{username ? (
					<>
						You&apos;re now a sponsor of{' '}
						<span className='font-semibold text-foreground'>@{username}</span>
					</>
				) : (
					'You are now a sponsor'
				)}
				{plan ? (
					<>
						{' '}
						on the <span className='font-semibold text-foreground'>{plan}</span> plan.
					</>
				) : (
					'.'
				)}
			</p>
			{username && (
				<Button onClick={() => router.push(`/${username}`)}>Go to channel</Button>
			)}
		</div>
	)
}
