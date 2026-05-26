import { Router, type IRouter } from "express";
import { db, commentsTable, complaintsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { AddCommentBody, AddCommentParams, ListCommentsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/complaints/:id/comments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListCommentsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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

  res.json(comments);
});

router.post("/complaints/:id/comments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin only" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddCommentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, params.data.id));
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const [comment] = await db.insert(commentsTable).values({
    complaintId: params.data.id,
    adminId: req.user!.id,
    comment: body.data.comment,
  }).returning();

  const admin = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.user!.id));

  res.status(201).json({ ...comment, adminUsername: admin[0]?.username ?? null });
});

export default router;
