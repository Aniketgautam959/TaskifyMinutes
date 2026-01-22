import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/app/lib/db'
import { User } from '@/app/models/User'

export async function GET() {
	const { userId } = await auth()
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	await connectToDatabase()
	const users = await User.find({}).sort({ createdAt: -1 }).lean()
	return NextResponse.json(
		users.map(u => ({
			id: u._id,
			clerkId: u.clerkId,
			email: u.email,
			firstName: u.firstName,
			lastName: u.lastName,
			imageUrl: u.imageUrl,
			createdAt: u.createdAt,
			updatedAt: u.updatedAt,
		}))
	)
}


