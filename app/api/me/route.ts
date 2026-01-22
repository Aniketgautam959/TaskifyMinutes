import { ensureUserSynced } from '@/app/lib/syncUser'
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/app/lib/db'
import { User } from '@/app/models/User'

export async function GET() {
	await connectToDatabase()
	const user = await ensureUserSynced()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	return NextResponse.json({
		id: user._id,
		clerkId: user.clerkId,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		imageUrl: user.imageUrl,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	})
}


