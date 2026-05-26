import { Router, type IRouter } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { count, and, sql, ilike, desc, or } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";
import { ListUsersQueryParams, UpdateUserParams, UpdateUserBody, DeleteUserParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const statsResult = await db.execute(sql`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::int AS today_count,
      COUNT(*) FILTER (WHERE status = 'resolved')::int          AS resolved_count,
      COUNT(*) FILTER (WHERE status = 'pending')::int           AS pending_count,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int       AS in_progress_count,
      COUNT(*) FILTER (WHERE status = 'rejected')::int          AS rejected_count
    FROM complaints
  `);
  const statsRow = statsResult.rows[0] as Record<string, unknown>;

  const [{ userCount }] = await db.select({ userCount: count() }).from(usersTable);

  res.json({
    totalComplaints: Number(statsRow.total),
    todayComplaints: Number(statsRow.today_count),
    resolvedComplaints: Number(statsRow.resolved_count),
    pendingComplaints: Number(statsRow.pending_count),
    inProgressComplaints: Number(statsRow.in_progress_count),
    rejectedComplaints: Number(statsRow.rejected_count),
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
      TO_CHAR(created_at::date, 'Mon DD') AS date,
      COUNT(*)::int AS count
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
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(
        ilike(usersTable.username, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
      )
    : undefined;

  const [{ total }] = await db.select({ total: count() }).from(usersTable).where(whereClause);

  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isBanned: usersTable.isBanned,
      createdAt: usersTable.createdAt,
    })
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
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(body.data)
    .where(sql`${usersTable.id} = ${params.data.id}`)
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

router.delete("/admin/users/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(sql`${usersTable.id} = ${params.data.id}`).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
