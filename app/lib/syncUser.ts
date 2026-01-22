import { connectToDatabase } from './db'
import { User } from '../models/User'
import { currentUser } from '@clerk/nextjs/server'

export async function ensureUserSynced() {
	const clerkUser = await currentUser()
	if (!clerkUser) return null

	await connectToDatabase()

	const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''

	let user = await User.findOne({ clerkId: clerkUser.id })
	if (!user) {
		user = await User.create({
			clerkId: clerkUser.id,
			email,
			firstName: clerkUser.firstName || undefined,
			lastName: clerkUser.lastName || undefined,
			imageUrl: clerkUser.imageUrl || undefined,
		})
	} else {
		const updates: Record<string, any> = {
			email,
			firstName: clerkUser.firstName || undefined,
			lastName: clerkUser.lastName || undefined,
			imageUrl: clerkUser.imageUrl || undefined,
		}
		await User.updateOne({ _id: user._id }, updates)
		user = await User.findById(user._id)
	}

	return user
}


