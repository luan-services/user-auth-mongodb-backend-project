import mongoose from "mongoose"

export const connectDatabase = async () => {
    try {
        const connect = await mongoose.connect(process.env.CONNECTION_STRING)
        console.log("Database connected: ", connect.connection.host)

    } catch (err) {
        console.log(err);
        process.exit(1)
    }

};