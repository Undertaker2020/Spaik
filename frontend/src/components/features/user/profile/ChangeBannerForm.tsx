'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon, Trash } from 'lucide-react'
import { type ChangeEvent, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/common/Button'
import { Form, FormField } from '@/components/ui/common/Form'
import { Skeleton } from '@/components/ui/common/Skeleton'
import { ConfirmModal } from '@/components/ui/elements/ConfirmModal'
import { FormWrapper } from '@/components/ui/elements/FormWrapper'

import {
	useChangeChannelBannerMutation,
	useRemoveChannelBannerMutation
} from '@/graphql/generated/output'

import { useCurrent } from '@/hooks/useCurrent'

import { type TypeUploadFileSchema, uploadFileSchema } from '@/schemas/upload-file.schema'

import { getMediaSource } from '@/utils/get-media-source'

export function ChangeBannerForm() {
	const { user, isLoadingProfile, refetch } = useCurrent()

	const inputRef = useRef<HTMLInputElement>(null)
	const form = useForm<TypeUploadFileSchema>({
		resolver: zodResolver(uploadFileSchema),
		values: {
			file: user?.banner!
		}
	})

	const [update, { loading: isLoadingUpdate }] = useChangeChannelBannerMutation({
		onCompleted() {
			refetch()
			toast.success('Banner updated')
		},
		onError() {
			toast.error('Failed to update the banner')
		}
	})

	const [remove, { loading: isLoadingRemove }] = useRemoveChannelBannerMutation({
		onCompleted() {
			refetch()
			toast.success('Banner removed')
		},
		onError() {
			toast.error('Failed to remove the banner')
		}
	})

	function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]

		if (file) {
			form.setValue('file', file)
			update({ variables: { banner: file } })
		}
	}

	if (isLoadingProfile) return <ChangeBannerFormSkeleton />

	return (
		<FormWrapper heading='Channel banner'>
			<Form {...form}>
				<FormField
					control={form.control}
					name='file'
					render={({ field }) => (
						<div className='px-5 pb-5'>
							<div className='space-y-3'>
								<div className='aspect-[4/1] w-full overflow-hidden rounded-lg bg-muted'>
									{field.value ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={
												field.value instanceof File
													? URL.createObjectURL(field.value)
													: getMediaSource(field.value)
											}
											alt='Channel banner'
											className='size-full object-cover'
										/>
									) : (
										<div className='flex size-full items-center justify-center'>
											<ImageIcon className='size-8 text-muted-foreground' />
										</div>
									)}
								</div>

								<div className='flex items-center gap-x-3'>
									<input
										className='hidden'
										type='file'
										ref={inputRef}
										onChange={handleImageChange}
									/>
									<Button
										variant='secondary'
										onClick={() => inputRef.current?.click()}
										disabled={isLoadingUpdate || isLoadingRemove}
									>
										Upload
									</Button>
									{user?.banner && (
										<ConfirmModal
											heading='Remove banner'
											message='Are you sure you want to remove the banner?'
											onConfirm={() => remove()}
										>
											<Button
												variant='ghost'
												size='lgIcon'
												disabled={isLoadingUpdate || isLoadingRemove}
											>
												<Trash className='size-4' />
											</Button>
										</ConfirmModal>
									)}
								</div>
								<p className='text-sm text-muted-foreground'>
									Recommended 1920×480. PNG, JPG or WEBP.
								</p>
							</div>
						</div>
					)}
				/>
			</Form>
		</FormWrapper>
	)
}

export function ChangeBannerFormSkeleton() {
	return <Skeleton className='h-52 w-full' />
}
