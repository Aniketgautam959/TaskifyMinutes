import mongoose, { Schema, Model, models } from 'mongoose'

export interface IUser {
	clerkId: string
	email: string
	firstName?: string
	lastName?: string
	imageUrl?: string
	createdAt: Date
	updatedAt: Date
}

const UserSchema = new Schema<IUser>(
	{
		clerkId: { type: String, required: true, unique: true, index: true },
		email: { type: String, required: true, index: true },
		firstName: { type: String },
		lastName: { type: String },
		imageUrl: { type: String },
	},
	{ timestamps: true }
)

export const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema)


