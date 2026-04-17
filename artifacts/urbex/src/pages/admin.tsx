import { useState } from "react";
import {
  useListUsers, useUpdateUserStatus,
  useListLocations, useUpdateLocation,
  useAdminListForumCategories, useAdminCreateForumCategory, useAdminUpdateForumCategory, useAdminDeleteForumCategory,
  useListCategories, useAdminCreateLocationCategory, useAdminUpdateLocationCategory, useAdminDeleteLocationCategory,
} from "@workspace/api-client-react";
import {
  Shield, Check, X, Users, MapPin, AlertCircle, MessageSquare, Tag,
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { type UpdateUserStatusBodyStatus } from "@workspace/api-client-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: locations } = useListLocations();
  const { data: forumCats, isLoading: forumCatsLoading } = useAdminListForumCategories();
  const { data: locationCats, isLoading: locCatsLoading } = useListCategories();

  const updateUserStatus = useUpdateUserStatus();
  const updateLocation = useUpdateLocation();
  const createForumCat = useAdminCreateForumCategory();
  const updateForumCat = useAdminUpdateForumCategory();
  const deleteForumCat = useAdminDeleteForumCategory();
  const createLocCat = useAdminCreateLocationCategory();
  const updateLocCat = useAdminUpdateLocationCategory();
  const deleteLocCat = useAdminDeleteLocationCategory();

  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const [forumCatForm, setForumCatForm] = useState({ name: "", slug: "", description: "", icon: "", sortOrder: "" });
  const [editingForumCat, setEditingForumCat] = useState<number | null>(null);

  const [locCatForm, setLocCatForm] = useState({ name: "", slug: "", icon: "", color: "#f59e0b", description: "" });
  const [editingLocCat, setEditingLocCat] = useState<number | null>(null);

  const pendingUsers = users?.filter(u => u.status === "pending") || [];
  const approvedUsers = users?.filter(u => u.status === "approved") || [];
  const bannedUsers = users?.filter(u => u.status === "banned") || [];
  const pendingLocations = locations?.filter(l => l.status === "pending") || [];

  const handleUserStatus = (userId: number, status: "approved" | "banned") => {
    updateUserStatus.mutate({ id: userId, data: { status: status as UpdateUserStatusBodyStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: `User ${status}` });
      },
      onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
    });
  };

  const handleLocationStatus = (locationId: number, status: "approved" | "rejected") => {
    updateLocation.mutate({ id: locationId, data: { status: status as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
        toast({ title: `Location ${status}` });
      },
      onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
    });
  };

  function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const handleSaveForumCat = () => {
    const data = {
      name: forumCatForm.name,
      slug: forumCatForm.slug || slugify(forumCatForm.name),
      description: forumCatForm.description || undefined,
      icon: forumCatForm.icon || undefined,
      sortOrder: forumCatForm.sortOrder ? parseInt(forumCatForm.sortOrder) : undefined,
    };
    if (editingForumCat) {
      updateForumCat.mutate({ id: editingForumCat, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/forum-categories"] });
          setForumCatForm({ name: "", slug: "", description: "", icon: "", sortOrder: "" });
          setEditingForumCat(null);
          toast({ title: "Category updated" });
        },
        onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
      });
    } else {
      createForumCat.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/forum-categories"] });
          setForumCatForm({ name: "", slug: "", description: "", icon: "", sortOrder: "" });
          toast({ title: "Category created" });
        },
        onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
      });
    }
  };

  const handleDeleteForumCat = (id: number) => {
    if (!confirm("Delete this forum category? All threads inside will lose their category.")) return;
    deleteForumCat.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/forum-categories"] });
        toast({ title: "Category deleted" });
      },
      onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
    });
  };

  const startEditForumCat = (cat: any) => {
    setEditingForumCat(cat.id);
    setForumCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      sortOrder: String(cat.sortOrder ?? ""),
    });
  };

  const handleSaveLocCat = () => {
    const data = {
      name: locCatForm.name,
      slug: locCatForm.slug || slugify(locCatForm.name),
      icon: locCatForm.icon || undefined,
      color: locCatForm.color || undefined,
      description: locCatForm.description || undefined,
    };
    if (editingLocCat) {
      updateLocCat.mutate({ id: editingLocCat, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          setLocCatForm({ name: "", slug: "", icon: "", color: "#f59e0b", description: "" });
          setEditingLocCat(null);
          toast({ title: "Category updated" });
        },
        onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
      });
    } else {
      createLocCat.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          setLocCatForm({ name: "", slug: "", icon: "", color: "#f59e0b", description: "" });
          toast({ title: "Category created" });
        },
        onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
      });
    }
  };

  const startEditLocCat = (cat: any) => {
    setEditingLocCat(cat.id);
    setLocCatForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon ?? "",
      color: cat.color ?? "#f59e0b",
      description: cat.description ?? "",
    });
  };

  const handleDeleteLocCat = (id: number) => {
    if (!confirm("Delete this location category?")) return;
    deleteLocCat.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: "Category deleted" });
      },
      onError: (err: any) => toast({ title: "Failed", description: err.error, variant: "destructive" }),
    });
  };

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-3">
          <Shield className="w-8 h-8" /> Admin Console
        </h1>
        <p className="text-muted-foreground mt-2">Network management, approvals, and board configuration.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1">
          <TabsTrigger value="users" className="font-mono flex gap-2">
            <Users className="w-4 h-4" /> Users
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-sm text-[10px]">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="locations" className="font-mono flex gap-2">
            <MapPin className="w-4 h-4" /> Locations
            {pendingLocations.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-sm text-[10px]">
                {pendingLocations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forum-cats" className="font-mono flex gap-2">
            <MessageSquare className="w-4 h-4" /> Forum Boards
          </TabsTrigger>
          <TabsTrigger value="loc-cats" className="font-mono flex gap-2">
            <Tag className="w-4 h-4" /> Location Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border font-mono font-bold uppercase text-sm">
              Pending Applications ({pendingUsers.length})
            </div>
            <div className="divide-y divide-border">
              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No pending applications.</div>
              ) : (
                pendingUsers.map(user => (
                  <div key={user.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-primary font-mono">{user.username}</h3>
                        <div className="text-sm text-muted-foreground mt-1 flex gap-4 flex-wrap">
                          <span>{user.email}</span>
                          {user.location && <span>📍 {user.location}</span>}
                          <span className="font-mono text-xs">Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-mono text-xs"
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        >
                          {expandedUser === user.id ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                          Application
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleUserStatus(user.id, "banned")}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-chart-2 hover:bg-chart-2/80 text-black"
                          onClick={() => handleUserStatus(user.id, "approved")}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>

                    {expandedUser === user.id && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {user.joinPurpose && (
                          <div className="text-sm">
                            <p className="font-mono text-xs uppercase text-muted-foreground mb-1">Purpose in community</p>
                            <p className="bg-background p-3 border border-border italic">"{user.joinPurpose}"</p>
                          </div>
                        )}
                        {user.joinReason && (
                          <div className="text-sm">
                            <p className="font-mono text-xs uppercase text-muted-foreground mb-1">Why they want to join</p>
                            <p className="bg-background p-3 border border-border italic">"{user.joinReason}"</p>
                          </div>
                        )}
                        {user.joinWhyAccept && (
                          <div className="text-sm">
                            <p className="font-mono text-xs uppercase text-muted-foreground mb-1">Why we should accept them</p>
                            <p className="bg-background p-3 border border-border italic">"{user.joinWhyAccept}"</p>
                          </div>
                        )}
                        {user.exploreExperience && (
                          <div className="text-sm">
                            <p className="font-mono text-xs uppercase text-muted-foreground mb-1">Exploration experience</p>
                            <p className="bg-background p-3 border border-border italic">"{user.exploreExperience}"</p>
                          </div>
                        )}
                        {!user.joinPurpose && !user.joinReason && !user.joinWhyAccept && (
                          <p className="text-xs text-muted-foreground italic">No application answers provided.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-card-border overflow-hidden">
              <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs">
                Approved Operatives ({approvedUsers.length})
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {approvedUsers.map(user => (
                  <div key={user.id} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold">{user.username}</span>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{user.postCount} posts · {user.locationCount} spots</span>
                        {user.role === "admin" && <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary text-primary">ADMIN</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:bg-destructive/10"
                      onClick={() => handleUserStatus(user.id, "banned")}
                    >
                      Ban
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-card-border overflow-hidden">
              <div className="bg-destructive/10 p-3 border-b border-border font-mono font-bold uppercase text-xs text-destructive">
                Banned Accounts ({bannedUsers.length})
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {bannedUsers.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No banned accounts.</div>
                ) : (
                  bannedUsers.map(user => (
                    <div key={user.id} className="p-3 flex items-center justify-between text-sm opacity-60 hover:opacity-100 transition-opacity">
                      <span className="line-through font-mono">{user.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-chart-2 hover:bg-chart-2/10"
                        onClick={() => handleUserStatus(user.id, "approved")}
                      >
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border font-mono font-bold uppercase text-sm">
              Pending Location Submissions ({pendingLocations.length})
            </div>
            <div className="divide-y divide-border">
              {pendingLocations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p>No pending locations.</p>
                </div>
              ) : (
                pendingLocations.map(location => (
                  <div key={location.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{location.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1 flex gap-4 font-mono text-xs">
                        <span>By: {location.addedByUsername}</span>
                        <span>Cat: {location.categoryName}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleLocationStatus(location.id, "rejected")}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-chart-2 hover:bg-chart-2/80 text-black"
                        onClick={() => handleLocationStatus(location.id, "approved")}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="forum-cats" className="space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs">
              Forum Boards
            </div>
            <div className="divide-y divide-border">
              {forumCatsLoading ? (
                <div className="p-6 text-center text-muted-foreground">Loading...</div>
              ) : forumCats?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No forum categories yet.</div>
              ) : (
                forumCats?.map(cat => (
                  <div key={cat.id} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{cat.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">/{cat.slug}</span>
                        <span className="text-xs font-mono text-muted-foreground">order:{cat.sortOrder}</span>
                      </div>
                      {cat.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{cat.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditForumCat(cat)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteForumCat(cat.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs">
              {editingForumCat ? "Edit Board" : "Add New Board"}
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Name *</label>
                  <Input
                    placeholder="General Discussion"
                    value={forumCatForm.name}
                    onChange={e => setForumCatForm(f => ({
                      ...f, name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Slug *</label>
                  <Input
                    placeholder="general-discussion"
                    value={forumCatForm.slug}
                    onChange={e => setForumCatForm(f => ({ ...f, slug: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Description</label>
                <Textarea
                  placeholder="What this board is for..."
                  value={forumCatForm.description}
                  onChange={e => setForumCatForm(f => ({ ...f, description: e.target.value }))}
                  className="resize-none h-16"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Icon</label>
                  <Input
                    placeholder="message-square"
                    value={forumCatForm.icon}
                    onChange={e => setForumCatForm(f => ({ ...f, icon: e.target.value }))}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Sort Order</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={forumCatForm.sortOrder}
                    onChange={e => setForumCatForm(f => ({ ...f, sortOrder: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveForumCat} disabled={!forumCatForm.name} className="font-mono">
                  {editingForumCat ? "Update Board" : "Create Board"}
                </Button>
                {editingForumCat && (
                  <Button variant="outline" onClick={() => { setEditingForumCat(null); setForumCatForm({ name: "", slug: "", description: "", icon: "", sortOrder: "" }); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loc-cats" className="space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs">
              Location Categories
            </div>
            <div className="divide-y divide-border">
              {locCatsLoading ? (
                <div className="p-6 text-center text-muted-foreground">Loading...</div>
              ) : locationCats?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No categories yet.</div>
              ) : (
                locationCats?.map(cat => (
                  <div key={cat.id} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: cat.color }} />
                      <div>
                        <span className="font-bold">{cat.name}</span>
                        <span className="text-xs font-mono text-muted-foreground ml-2">/{cat.slug}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditLocCat(cat)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLocCat(cat.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs">
              {editingLocCat ? "Edit Category" : "Add Location Category"}
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Name *</label>
                  <Input
                    placeholder="Graffiti"
                    value={locCatForm.name}
                    onChange={e => setLocCatForm(f => ({
                      ...f, name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Slug *</label>
                  <Input
                    placeholder="graffiti"
                    value={locCatForm.slug}
                    onChange={e => setLocCatForm(f => ({ ...f, slug: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Icon</label>
                  <Input
                    placeholder="building"
                    value={locCatForm.icon}
                    onChange={e => setLocCatForm(f => ({ ...f, icon: e.target.value }))}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={locCatForm.color}
                      onChange={e => setLocCatForm(f => ({ ...f, color: e.target.value }))}
                      className="h-9 w-12 rounded border border-border bg-transparent cursor-pointer"
                    />
                    <Input
                      value={locCatForm.color}
                      onChange={e => setLocCatForm(f => ({ ...f, color: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">Description</label>
                  <Input
                    placeholder="Short description"
                    value={locCatForm.description}
                    onChange={e => setLocCatForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveLocCat} disabled={!locCatForm.name} className="font-mono">
                  {editingLocCat ? "Update Category" : "Create Category"}
                </Button>
                {editingLocCat && (
                  <Button variant="outline" onClick={() => { setEditingLocCat(null); setLocCatForm({ name: "", slug: "", icon: "", color: "#f59e0b", description: "" }); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
