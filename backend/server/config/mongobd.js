import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "mern",
            // Apply the Stable API settings from the docs here
            serverApi: {
                version: '1',
                strict: false,
                deprecationErrors: true,
            }
        });
        console.log(" Database Connected");
    } catch (error) {
        console.error(" Database Connection Error:", error);
    }
};

export default connectDB;
