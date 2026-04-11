import { Router, type IRouter } from "express";
import { db, locationsTable, usersTable, categoriesTable } from "@workspace/db";
import { eq, and, sql, ilike, desc } from "drizzle-orm";
import { CreateLocationBody, UpdateLocationBody, ListLocationsQueryParams, GetLocationParams, UpdateLocationParams, DeleteLocationParams } from "@workspace/api-zod";

const router: IRouter = Router();

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

function serializeLocation(loc: any, cat?: any, user?: any) {
  return {
    id: loc.id,
    title: loc.title,
    description: loc.description,
    latitude: loc.latitude,
    longitude: loc.longitude,
    categoryId: loc.categoryId,
    categoryName: cat?.name ?? undefined,
    categoryIcon: cat?.icon ?? undefined,
    categoryColor: cat?.color ?? undefined,
    state: loc.state ?? undefined,
    country: loc.country,
    addedById: loc.addedById,
    addedByUsername: user?.username ?? undefined,
    riskLevel: loc.riskLevel,
    status: loc.status,
    imageUrl: loc.imageUrl ?? undefined,
    accessNotes: loc.accessNotes ?? undefined,
    hazards: loc.hazards ?? undefined,
    bestTimeToVisit: loc.bestTimeToVisit ?? undefined,
    createdAt: loc.createdAt.toISOString(),
    viewCount: loc.viewCount,
  };
}

router.get("/locations/stats", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return;
  }

  const cats = await db.select().from(categoriesTable);
  const locs = await db.select().from(locationsTable).where(eq(locationsTable.status, "approved"));

  const byCategory = cats.map(cat => {
    const count = locs.filter(l => l.categoryId === cat.id).length;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      count,
    };
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentlyAdded = locs.filter(l => l.createdAt > sevenDaysAgo).length;

  const countByCountry: Record<string, number> = {};
  for (const l of locs) {
    countByCountry[l.country] = (countByCountry[l.country] || 0) + 1;
  }
  const byCountry = Object.entries(countByCountry).map(([country, count]) => ({ country, count }));

  res.json({
    total: locs.length,
    byCategory,
    recentlyAdded,
    byCountry,
  });
});

router.get("/locations/recent", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return;
  }

  const locs = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.status, "approved"))
    .orderBy(desc(locationsTable.createdAt))
    .limit(10);

  const cats = await db.select().from(categoriesTable);
  const users = await db.select().from(usersTable);

  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json(locs.map(l => serializeLocation(l, catMap[l.categoryId], userMap[l.addedById])));
});

router.get("/locations", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return;
  }

  const params = ListLocationsQueryParams.safeParse(req.query);

  let locs = await db.select().from(locationsTable).where(eq(locationsTable.status, "approved")).orderBy(desc(locationsTable.createdAt));

  if (params.success) {
    if (params.data.categoryId) {
      locs = locs.filter(l => l.categoryId === params.data.categoryId);
    }
    if (params.data.state) {
      locs = locs.filter(l => l.state?.toLowerCase() === (params.data.state as string).toLowerCase());
    }
    if (params.data.search) {
      const q = (params.data.search as string).toLowerCase();
      locs = locs.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
  }

  const cats = await db.select().from(categoriesTable);
  const users = await db.select().from(usersTable);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json(locs.map(l => serializeLocation(l, catMap[l.categoryId], userMap[l.addedById])));
});

router.post("/locations", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [loc] = await db.insert(locationsTable).values({
    ...parsed.data,
    addedById: me.id,
    status: "approved",
  }).returning();

  await db.update(usersTable).set({ locationCount: me.locationCount + 1 }).where(eq(usersTable.id, me.id));

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, loc.categoryId));
  await db.update(categoriesTable).set({ locationCount: (cat?.locationCount ?? 0) + 1 }).where(eq(categoriesTable.id, loc.categoryId));

  res.status(201).json(serializeLocation(loc, cat, me));
});

router.get("/locations/:id", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return;
  }

  const params = GetLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [loc] = await db.select().from(locationsTable).where(eq(locationsTable.id, params.data.id));
  if (!loc) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  await db.update(locationsTable).set({ viewCount: loc.viewCount + 1 }).where(eq(locationsTable.id, loc.id));

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, loc.categoryId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, loc.addedById));

  res.json({
    ...serializeLocation(loc, cat, user),
    images: loc.imageUrl ? [loc.imageUrl] : [],
    relatedThreads: [],
  });
});

router.patch("/locations/:id", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const params = UpdateLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [loc] = await db.select().from(locationsTable).where(eq(locationsTable.id, params.data.id));
  if (!loc) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  if (loc.addedById !== me.id && me.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const body = UpdateLocationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db.update(locationsTable).set(body.data).where(eq(locationsTable.id, params.data.id)).returning();

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated.categoryId));
  res.json(serializeLocation(updated, cat, me));
});

router.delete("/locations/:id", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const params = DeleteLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [loc] = await db.select().from(locationsTable).where(eq(locationsTable.id, params.data.id));
  if (!loc) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  if (loc.addedById !== me.id && me.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(locationsTable).where(eq(locationsTable.id, params.data.id));
  res.json({ message: "Location deleted" });
});

export default router;
