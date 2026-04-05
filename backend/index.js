import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from "./server/config/mongobd.js";
import 'dotenv/config'
import authRouter from "./server/routes/authroute.js";
import songRoute from "./server/routes/songRoute.js";
import aiRoute from "./server/routes/aiRoute.js";
import listenerRouter from "./server/routes/listenerRoute.js";

const app = express();

connectDB();
const PORT = process.env.PORT || 5001;



app.use(express.json());
app.use(cookieParser());

// Configure CORS based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, no need for CORS as frontend and backend are on same origin
  // But if needed, you can use:
  app.use(cors({
    origin: true, // Allow the server's origin
    credentials: true
  }));
} else {
  // In development, allow requests from frontend dev server
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
}

// API Endpoints
app.get('/api', (req, res) => {
  return res.status(200).send('Welcome to API');
});
app.use('/api/auth', authRouter)
app.use('/api/song', songRoute)
app.use('/api/listener', listenerRouter)
app.use('/api/ai', aiRoute);



app.listen(PORT, () => {
    console.log(`Port running at ${PORT} `)
})