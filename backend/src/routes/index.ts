import { Router } from "express";
import authRoutes from "./auth";
import announcementRoutes from "./announcements";
import locationRoutes from "./locations";

const router = Router();

router.use("/auth", authRoutes);
router.use("/announcements", announcementRoutes);
router.use("/locations", locationRoutes);

export default router;

