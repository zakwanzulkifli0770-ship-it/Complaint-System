import { Router, type IRouter } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
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

const COMPLAINT_FIELDS = {
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
};

const COMMENT_FIELDS = {
  id: commentsTable.id,
  complaintId: commentsTable.complaintId,
  adminId: commentsTable.adminId,
  comment: commentsTable.comment,
  createdAt: commentsTable.createdAt,
  adminUsername: usersTable.username,
};

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
    res.status(400).json({ error: "Invalid query parameters" });
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
        ilike(complaintsTable.title, `%${search}%`),
        ilike(complaintsTable.ticketId, `%${search}%`),
        ilike(complaintsTable.category, `%${search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(complaintsTable).where(whereClause),
    db
      .select(COMPLAINT_FIELDS)
      .from(complaintsTable)
      .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(complaintsTable.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  res.json({ complaints: rows, total, page, limit });
});

router.post("/complaints", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  let ticketId = generateTicketId();
  for (let attempts = 0; attempts < 5; attempts++) {
    const [existing] = await db
      .select({ id: complaintsTable.id })
      .from(complaintsTable)
      .where(eq(complaintsTable.ticketId, ticketId));
    if (!existing) break;
    ticketId = generateTicketId();
  }

  const [complaint] = await db
    .insert(complaintsTable)
    .values({ ...parsed.data, ticketId, userId: req.user!.id })
    .returning();

  const [user] = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));

  res.status(201).json({ ...complaint, username: user?.username ?? null });
});

router.get("/complaints/ticket/:ticketId", async (req, res): Promise<void> => {
  const params = GetComplaintByTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const [complaint] = await db
    .select(COMPLAINT_FIELDS)
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
    .where(eq(complaintsTable.ticketId, params.data.ticketId));

  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const comments = await db
    .select(COMMENT_FIELDS)
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
    res.status(400).json({ error: "Invalid complaint ID" });
    return;
  }

  const [complaint] = await db
    .select(COMPLAINT_FIELDS)
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
    .where(eq(complaintsTable.id, params.data.id));

  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  if (req.user!.role !== "admin" && complaint.userId !== req.user!.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const comments = await db
    .select(COMMENT_FIELDS)
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.adminId, usersTable.id))
    .where(eq(commentsTable.complaintId, params.data.id))
    .orderBy(commentsTable.createdAt);

  res.json({ ...complaint, comments });
});

router.patch("/complaints/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateComplaintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid complaint ID" });
    return;
  }

  const body = UpdateComplaintBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
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

  const [user] = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, updated.userId));

  res.json({ ...updated, username: user?.username ?? null });
});

router.delete("/complaints/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteComplaintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid complaint ID" });
    return;
  }

  const [deleted] = await db
    .delete(complaintsTable)
    .where(eq(complaintsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
