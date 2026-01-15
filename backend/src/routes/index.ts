import { Router } from "express";
import authRoutes from "./auth";
import announcementRoutes from "./announcements";
import locationRoutes from "./locations";
import profileRoutes from "./profile";
import presenceRoutes from "./presence";
import userRoutes from "./users";
import muleRoutes from "./mules";
import cryptoRoutes from "./crypto";

const router = Router();

router.use("/auth", authRoutes);
router.use("/announcements", announcementRoutes);
router.use("/locations", locationRoutes);
router.use("/profile", profileRoutes);
router.use("/presence", presenceRoutes);
router.use("/users", userRoutes);
router.use("/mules", muleRoutes);
router.use("/crypto", cryptoRoutes);

export default router;

