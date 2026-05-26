import { Router, type IRouter } from "express";
import { db, usersTable, complaintsTable } from "@workspace/db";
import { eq, desc, count, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.id;

  const statsResult = await db.execute(sql`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int           AS pending,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int       AS in_progress,
      COUNT(*) FILTER (WHERE status = 'resolved')::int          AS resolved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int          AS rejected
    FROM complaints
    WHERE user_id = ${userId}
  `);

  const stats = statsResult.rows[0] as Record<string, unknown>;

  const recentComplaints = await db
    .select()
    .from(complaintsTable)
    .where(eq(complaintsTable.userId, userId))
    .orderBy(desc(complaintsTable.createdAt))
    .limit(5);

  res.json({
    totalComplaints: Number(stats.total),
    pendingComplaints: Number(stats.pending),
    inProgressComplaints: Number(stats.in_progress),
    resolvedComplaints: Number(stats.resolved),
    rejectedComplaints: Number(stats.rejected),
    recentComplaints,
  });
});

router.patch("/users/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(body.data)
    .where(eq(usersTable.id, req.user!.id))
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isBanned: usersTable.isBanned,
      createdAt: usersTable.createdAt,
    });

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

export default router;
