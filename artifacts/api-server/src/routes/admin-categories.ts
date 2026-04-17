import { Router, type IRouter } from "express";
import { db, usersTable, forumCategoriesTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AdminCreateForumCategoryBody,
  AdminUpdateForumCategoryBody,
  AdminCreateLocationCategoryBody,
  AdminUpdateLocationCategoryBody,
  AdminDeleteForumCategoryParams,
  AdminDeleteLocationCategoryParams,
  AdminUpdateForumCategoryParams,
  AdminUpdateLocationCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<typeof usersTable.$inferSelect | null> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  return me;
}

router.get("/admin/forum-categories", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;
  const cats = await db.select().from(forumCategoriesTable).orderBy(forumCategoriesTable.sortOrder);
  res.json(cats);
});

router.post("/admin/forum-categories", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  const parsed = AdminCreateForumCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, slug, description, icon, sortOrder } = parsed.data;

  const [existing] = await db.select().from(forumCategoriesTable).where(eq(forumCategoriesTable.slug, slug));
  if (existing) {
    res.status(400).json({ error: "A category with that slug already exists" });
    return;
  }

  const [cat] = await db
    .insert(forumCategoriesTable)
    .values({ name, slug, description: description ?? null, icon: icon ?? "message-square", sortOrder: sortOrder ?? 99 })
    .returning();

  res.status(201).json(cat);
});

router.put("/admin/forum-categories/:id", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  const params = AdminUpdateForumCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = AdminUpdateForumCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, slug, description, icon, sortOrder } = parsed.data;

  const [updated] = await db
    .update(forumCategoriesTable)
    .set({ name, slug, description: description ?? null, icon: icon ?? "message-square", sortOrder: sortOrder ?? 99 })
    .where(eq(forumCategoriesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(updated);
});

router.delete("/admin/forum-categories/:id", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  const params = AdminDeleteForumCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(forumCategoriesTable).where(eq(forumCategoriesTable.id, params.data.id));
  res.json({ message: "Category deleted" });
});

router.post("/admin/location-categories", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  const parsed = AdminCreateLocationCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, slug, icon, color, description } = parsed.data;

  const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug));
  if (existing) {
    res.status(400).json({ error: "A category with that slug already exists" });
    return;
  }

  const [cat] = await db
    .insert(categoriesTable)
    .values({ name, slug, icon: icon ?? "tag", color: color ?? "#f59e0b", description: description ?? null })
    .returning();

  res.status(201).json(cat);
});

router.put("/admin/location-categories/:id", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  const params = AdminUpdateLocationCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = AdminUpdateLocationCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, slug, icon, color, description } = parsed.data;

  const [updated] = await db
    .update(categoriesTable)
    .set({ name, slug, icon: icon ?? "tag", color: color ?? "#f59e0b", description: description ?? null })
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(updated);
});

router.delete("/admin/location-categories/:id", async (req, res): Promise<void> => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  const params = AdminDeleteLocationCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.json({ message: "Category deleted" });
});

export default router;
