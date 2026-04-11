import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
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
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  if (user.status === "banned") {
    res.status(401).json({ error: "Your account has been banned" });
    return;
  }

  req.session = { userId: user.id };
  res.json({ user: serializeUser(user), message: "Logged in successfully" });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, email, bio, location } = parsed.data;

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existingUser) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const [existingEmail] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingEmail) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    bio: bio ?? null,
    location: location ?? null,
    role: "member",
    status: "pending",
  });

  req.log.info({ username }, "New user registered");
  res.status(201).json({ message: "Registration submitted. Waiting for admin approval." });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session = null;
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    req.session = null;
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

export { serializeUser };
export default router;
