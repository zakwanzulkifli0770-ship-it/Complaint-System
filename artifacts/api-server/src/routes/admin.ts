import { Router, type IRouter } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { eq, count, and, sql, like, desc } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";
import { ListUsersQueryParams, UpdateUserParams, UpdateUserBody, DeleteUserParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ total }] = await db.select({ total: count() }).from(complaintsTable);
  const [{ todayCount }] = await db.select({ todayCount: count() }).from(complaintsTable).where(sql`${complaintsTable.createdAt} >= ${today}`);
  const [{ resolvedCount }] = await db.select({ resolvedCount: count() }).from(complaintsTable).where(eq(complaintsTable.status, "resolved"));
  const [{ pendingCount }] = await db.select({ pendingCount: count() }).from(complaintsTable).where(eq(complaintsTable.status, "pending"));
  const [{ inProgressCount }] = await db.select({ inProgressCount: count() }).from(complaintsTable).where(eq(complaintsTable.status, "in_progress"));
  const [{ rejectedCount }] = await db.select({ rejectedCount: count() }).from(complaintsTable).where(eq(complaintsTable.status, "rejected"));
  const [{ userCount }] = await db.select({ userCount: count() }).from(usersTable);

  res.json({
    totalComplaints: total,
    todayComplaints: todayCount,
    resolvedComplaints: resolvedCount,
    pendingComplaints: pendingCount,
    inProgressComplaints: inProgressCount,
    rejectedComplaints: rejectedCount,
    totalUsers: userCount,
  });
});

router.get("/admin/stats/categories", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ category: complaintsTable.category, count: count() })
    .from(complaintsTable)
    .groupBy(complaintsTable.category)
    .orderBy(desc(count()));

  res.json(rows);
});

router.get("/admin/stats/trend", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(created_at::date, 'YYYY-MM-DD') as date,
      COUNT(*)::int as count
    FROM complaints
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY created_at::date
    ORDER BY created_at::date ASC
  `);

  res.json(rows.rows);
});

router.get("/admin/users", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions = search ? [like(usersTable.username, `%${search}%`)] : [];
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(usersTable).where(whereClause);

  const users = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, isBanned: usersTable.isBanned, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(whereClause)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ users, total, page, limit });
});

router.patch("/admin/users/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(body.data)
    .where(eq(usersTable.id, params.data.id))
    .returning({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, isBanned: usersTable.isBanned, createdAt: usersTable.createdAt });

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

router.delete("/admin/users/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
