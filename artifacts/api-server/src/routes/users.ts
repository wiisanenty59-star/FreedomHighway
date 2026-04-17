import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UpdateUserStatusBody, ListUsersQueryParams, GetUserParams, UpdateUserStatusParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

const POSTS_TO_INVITE = 10;
const LOCATIONS_TO_INVITE = 2;

function serializeUser(user: typeof usersTable.$inferSelect) {
  const canSendInvites =
    user.status === "approved" &&
    user.postCount >= POSTS_TO_INVITE &&
    user.locationCount >= LOCATIONS_TO_INVITE;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    bio: user.bio ?? undefined,
    location: user.location ?? undefined,
    joinedAt: user.joinedAt.toISOString(),
    postCount: user.postCount,
    locationCount: user.locationCount,
    joinPurpose: user.joinPurpose ?? undefined,
    joinReason: user.joinReason ?? undefined,
    joinWhyAccept: user.joinWhyAccept ?? undefined,
    exploreExperience: user.exploreExperience ?? undefined,
    canSendInvites,
  };
}

router.get("/users/admins", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Not approved" });
    return;
  }

  const admins = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  res.json(admins.map(serializeUser));
});

router.get("/users", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const params = ListUsersQueryParams.safeParse(req.query);

  if (params.success && params.data.status) {
    const users = await db.select().from(usersTable).where(eq(usersTable.status, params.data.status));
    res.json(users.map(serializeUser));
    return;
  }

  const users = await db.select().from(usersTable);
  res.json(users.map(serializeUser));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const params = UpdateUserStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const body = UpdateUserStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferSelect> = {};
  if (body.data.status !== undefined) updateData.status = body.data.status;
  if (body.data.role !== undefined) updateData.role = body.data.role;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(updated));
});

export default router;
