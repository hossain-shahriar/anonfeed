import mongoose from "mongoose";

type ConnectionObject = {
    isConnected: number;
};

const connection: ConnectionObject = {
    isConnected: 0 // Initialize isConnected property
};

async function dbConnect(): Promise<void> {
    // If no MongoDB URI is found, skip the connection (for build phase)
    if (!process.env.MONGODB_URI) {
        console.log("No MongoDB URI found, skipping connection");
        return;
    }

    if (connection.isConnected) {
        console.log("Using existing database connection");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || "", {});

        connection.isConnected = db.connections[0].readyState;

        console.log("New database connection successfully established");
    } catch (error) {
        console.log("Error connecting to database: ", error);
        process.exit(1);
    }
}

export default dbConnect;
