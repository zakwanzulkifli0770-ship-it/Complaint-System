import { Router, type IRouter } from "express";
import { db, usersTable, complaintsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.id;

  const [{ total }] = await db.select({ total: count() }).from(complaintsTable).where(eq(complaintsTable.userId, userId));
  const [{ pending }] = await db.select({ pending: count() }).from(complaintsTable).where(eq(complaintsTable.userId, userId)).where(eq(complaintsTable.status, "pending"));
  const [{ inProgress }] = await db.select({ inProgress: count() }).from(complaintsTable).where(eq(complaintsTable.userId, userId)).where(eq(complaintsTable.status, "in_progress"));
  const [{ resolved }] = await db.select({ resolved: count() }).from(complaintsTable).where(eq(complaintsTable.userId, userId)).where(eq(complaintsTable.status, "resolved"));
  const [{ rejected }] = await db.select({ rejected: count() }).from(complaintsTable).where(eq(complaintsTable.userId, userId)).where(eq(complaintsTable.status, "rejected"));

  const recentComplaints = await db
    .select()
    .from(complaintsTable)
    .where(eq(complaintsTable.userId, userId))
    .orderBy(desc(complaintsTable.createdAt))
    .limit(5);

  res.json({
    totalComplaints: total,
    pendingComplaints: pending,
    inProgressComplaints: inProgress,
    resolvedComplaints: resolved,
    rejectedComplaints: rejected,
    recentComplaints,
  });
});

router.patch("/users/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(body.data)
    .where(eq(usersTable.id, req.user!.id))
    .returning({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, isBanned: usersTable.isBanned, createdAt: usersTable.createdAt });

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

export default router;
