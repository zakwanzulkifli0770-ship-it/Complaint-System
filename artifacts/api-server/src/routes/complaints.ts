import { Router, type IRouter } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { eq, desc, and, like, or, count, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import {
  CreateComplaintBody,
  UpdateComplaintBody,
  GetComplaintParams,
  UpdateComplaintParams,
  DeleteComplaintParams,
  GetComplaintByTicketParams,
  ListComplaintsQueryParams,
} from "@workspace/api-zod";
import { commentsTable } from "@workspace/db";

const router: IRouter = Router();

function generateTicketId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ADU-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.get("/complaints", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const query = ListComplaintsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, category, priority, search, page = 1, limit = 10 } = query.data;
  const isAdmin = req.user!.role === "admin";
  const userId = req.user!.id;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (!isAdmin) conditions.push(eq(complaintsTable.userId, userId));
  if (status) conditions.push(eq(complaintsTable.status, status));
  if (category) conditions.push(eq(complaintsTable.category, category));
  if (priority) conditions.push(eq(complaintsTable.priority, priority));
  if (search) {
    conditions.push(
      or(
        like(complaintsTable.title, `%${search}%`),
        like(complaintsTable.ticketId, `%${search}%`),
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(complaintsTable)
    .where(whereClause);

  const rows = await db
    .select({
      id: complaintsTable.id,
      ticketId: complaintsTable.ticketId,
      userId: complaintsTable.userId,
      category: complaintsTable.category,
      title: complaintsTable.title,
      description: complaintsTable.description,
      status: complaintsTable.status,
      priority: complaintsTable.priority,
      location: complaintsTable.location,
      phone: complaintsTable.phone,
      imageUrl: complaintsTable.imageUrl,
      createdAt: complaintsTable.createdAt,
      updatedAt: complaintsTable.updatedAt,
      username: usersTable.username,
    })
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
    .where(whereClause)
    .orderBy(desc(complaintsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ complaints: rows, total, page, limit });
});

router.post("/complaints", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let ticketId = generateTicketId();
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.ticketId, ticketId));
    if (!existing) break;
    ticketId = generateTicketId();
    attempts++;
  }

  const [complaint] = await db.insert(complaintsTable).values({
    ...parsed.data,
    ticketId,
    userId: req.user!.id,
  }).returning();

  const user = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.user!.id));

  res.status(201).json({ ...complaint, username: user[0]?.username ?? null });
});

router.get("/complaints/ticket/:ticketId", async (req, res): Promise<void> => {
  const params = GetComplaintByTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [complaint] = await db
    .select({
      id: complaintsTable.id,
      ticketId: complaintsTable.ticketId,
      userId: complaintsTable.userId,
      category: complaintsTable.category,
      title: complaintsTable.title,
      description: complaintsTable.description,
      status: complaintsTable.status,
      priority: complaintsTable.priority,
      location: complaintsTable.location,
      phone: complaintsTable.phone,
      imageUrl: complaintsTable.imageUrl,
      createdAt: complaintsTable.createdAt,
      updatedAt: complaintsTable.updatedAt,
      username: usersTable.username,
    })
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
    .where(eq(complaintsTable.ticketId, params.data.ticketId));

  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const comments = await db
    .select({
      id: commentsTable.id,
      complaintId: commentsTable.complaintId,
      adminId: commentsTable.adminId,
      comment: commentsTable.comment,
      createdAt: commentsTable.createdAt,
      adminUsername: usersTable.username,
    })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.adminId, usersTable.id))
    .where(eq(commentsTable.complaintId, complaint.id))
    .orderBy(commentsTable.createdAt);

  res.json({ ...complaint, comments });
});

router.get("/complaints/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetComplaintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [complaint] = await db
    .select({
      id: complaintsTable.id,
      ticketId: complaintsTable.ticketId,
      userId: complaintsTable.userId,
      category: complaintsTable.category,
      title: complaintsTable.title,
      description: complaintsTable.description,
      status: complaintsTable.status,
      priority: complaintsTable.priority,
      location: complaintsTable.location,
      phone: complaintsTable.phone,
      imageUrl: complaintsTable.imageUrl,
      createdAt: complaintsTable.createdAt,
      updatedAt: complaintsTable.updatedAt,
      username: usersTable.username,
    })
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
    .where(eq(complaintsTable.id, params.data.id));

  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  if (req.user!.role !== "admin" && complaint.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const comments = await db
    .select({
      id: commentsTable.id,
      complaintId: commentsTable.complaintId,
      adminId: commentsTable.adminId,
      comment: commentsTable.comment,
      createdAt: commentsTable.createdAt,
      adminUsername: usersTable.username,
    })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.adminId, usersTable.id))
    .where(eq(commentsTable.complaintId, params.data.id))
    .orderBy(commentsTable.createdAt);

  res.json({ ...complaint, comments });
});

router.patch("/complaints/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin only" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateComplaintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateComplaintBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(complaintsTable)
    .set(body.data)
    .where(eq(complaintsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const user = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json({ ...updated, username: user[0]?.username ?? null });
});

router.delete("/complaints/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin only" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteComplaintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(complaintsTable).where(eq(complaintsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
