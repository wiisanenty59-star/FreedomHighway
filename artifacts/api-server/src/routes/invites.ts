import { Router, type IRouter } from "express";
import { db, usersTable, invitesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const POSTS_REQUIRED = 10;
const LOCATIONS_REQUIRED = 2;
const INVITE_EXPIRY_DAYS = 14;

async function requireApproved(req: any, res: any): Promise<typeof usersTable.$inferSelect | null> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return null;
  }
  return me;
}

function serializeInvite(invite: typeof invitesTable.$inferSelect) {
  return {
    id: invite.id,
    code: invite.code,
    createdById: invite.createdById,
    usedById: invite.usedById ?? null,
    usedAt: invite.usedAt?.toISOString() ?? null,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  };
}

router.get("/invites/eligibility", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  res.json({
    eligible: me.postCount >= POSTS_REQUIRED && me.locationCount >= LOCATIONS_REQUIRED,
    postCount: me.postCount,
    locationCount: me.locationCount,
    requiredPosts: POSTS_REQUIRED,
    requiredLocations: LOCATIONS_REQUIRED,
  });
});

router.get("/invites/validate/:code", async (req, res): Promise<void> => {
  const { code } = req.params;

  const [invite] = await db
    .select()
    .from(invitesTable)
    .where(eq(invitesTable.code, code));

  if (!invite) {
    res.status(400).json({ error: "Invalid invite code" });
    return;
  }

  if (invite.usedById) {
    res.status(400).json({ error: "Invite code has already been used" });
    return;
  }

  if (new Date() > invite.expiresAt) {
    res.status(400).json({ error: "Invite code has expired" });
    return;
  }

  res.json({ message: "Invite code is valid" });
});

router.get("/invites", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const invites = await db
    .select()
    .from(invitesTable)
    .where(eq(invitesTable.createdById, me.id));

  res.json(invites.map(serializeInvite));
});

router.post("/invites", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  if (me.postCount < POSTS_REQUIRED || me.locationCount < LOCATIONS_REQUIRED) {
    res.status(403).json({
      error: `You need at least ${POSTS_REQUIRED} posts and ${LOCATIONS_REQUIRED} hidden spots to send invites. You have ${me.postCount} posts and ${me.locationCount} spots.`,
    });
    return;
  }

  const unusedInvites = await db
    .select()
    .from(invitesTable)
    .where(and(eq(invitesTable.createdById, me.id), isNull(invitesTable.usedById)));

  if (unusedInvites.length >= 3) {
    res.status(400).json({ error: "You already have 3 unused invite codes. Use or let them expire first." });
    return;
  }

  const code = crypto.randomBytes(5).toString("hex").toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const [invite] = await db
    .insert(invitesTable)
    .values({
      code,
      createdById: me.id,
      expiresAt,
    })
    .returning();

  res.status(201).json(serializeInvite(invite));
});

export default router;
