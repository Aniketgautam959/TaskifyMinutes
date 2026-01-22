import mongoose from 'mongoose'

const GLOBAL_MONGO = global as unknown as {
	mongooseConn: Promise<typeof mongoose> | null
}

if (!GLOBAL_MONGO.mongooseConn) {
	GLOBAL_MONGO.mongooseConn = null
}

export async function connectToDatabase(): Promise<typeof mongoose> {
	if (GLOBAL_MONGO.mongooseConn) {
		return GLOBAL_MONGO.mongooseConn
	}

	const uri = process.env.MONGODB_URI
	if (!uri) {
		throw new Error('MONGODB_URI is not set')
	}

	GLOBAL_MONGO.mongooseConn = mongoose.connect(uri, {
		bufferCommands: false,
	})

	return GLOBAL_MONGO.mongooseConn
}


