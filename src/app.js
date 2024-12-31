import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRoute from "./routes/users-routes.js"; 
import videoRoute from "./routes/video-routes.js";
import playlistRouter from "./routes/playlist-routes.js";
import tweetRouter from "./routes/tweet-routes.js";
import commentRouter from"./routes/comments-routes.js";
import likeRouter from "./routes/likes-routes.js";
import subscriptionRouter from "./routes/subscription-routes.js";
import dashboardRouter from "./routes/dashboard-routes.js";
import healthcheckRouter from "./routes/healthcheck-routes.js"

// routes dicleration
app.use("/api/v1/users", userRoute);
app.use("/api/v1/videos",videoRoute);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)

// url like this:
// http://localhost:3000/api/v1/users/register

export {app}