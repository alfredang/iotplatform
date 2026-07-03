"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, Star } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

type Cat = { id: string; name: string; slug: string; _count?: { posts: number } };
type Tag = { id: string; name: string; slug: string };
type Post = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  coverImage: string | null; published: boolean; featured: boolean; likes: number;
  category: { name: string } | null; tags: { name: string }[]; _count?: { reviews: number };
};

const empty = {
  title: "", slug: "", excerpt: "", content: "", coverImage: "",
  categoryId: "", tags: "", published: true, featured: false,
};

export function BlogAdmin() {
  const { data, mutate, isLoading } = useSWR<{ posts: Post[] }>("/api/admin/blog", fetcher);
  const { data: tax, mutate: mutateTax } = useSWR<{ categories: Cat[]; tags: Tag[] }>("/api/admin/blog/taxonomy", fetcher);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newCat, setNewCat] = useState("");

  const posts = data?.posts ?? [];
  const categories = tax?.categories ?? [];

  function openCreate() { setEditId(null); setForm({ ...empty }); setError(""); setOpen(true); }
  function openEdit(p: Post) {
    setEditId(p.id);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
      coverImage: p.coverImage || "",
      categoryId: categories.find((c) => c.name === p.category?.name)?.id || "",
      tags: p.tags.map((t) => t.name).join(", "),
      published: p.published, featured: p.featured,
    });
    setError(""); setOpen(true);
  }

  async function save() {
    setError("");
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setError("Title, excerpt and content are required"); return;
    }
    setSaving(true);
    const body = JSON.stringify({
      title: form.title, slug: form.slug || undefined, excerpt: form.excerpt,
      content: form.content, coverImage: form.coverImage,
      categoryId: form.categoryId || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published: form.published, featured: form.featured,
    });
    try {
      if (editId) await apiFetch(`/api/admin/blog/${editId}`, { method: "PATCH", body });
      else await apiFetch("/api/admin/blog", { method: "POST", body });
      setOpen(false); mutate(); mutateTax();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally { setSaving(false); }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await apiFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    mutate();
  }

  async function addCategory() {
    if (!newCat.trim()) return;
    await apiFetch("/api/admin/blog/taxonomy?type=category", { method: "POST", body: JSON.stringify({ name: newCat }) });
    setNewCat(""); mutateTax();
  }

  return (
    <div className="space-y-6">
      {/* Categories manager */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.length === 0 && <span className="text-sm text-muted">None yet.</span>}
                {categories.map((c) => (
                  <Badge key={c.id} tone="muted">{c.name} · {c._count?.posts ?? 0}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="h-9" />
              <Button size="sm" variant="outline" onClick={addCategory}><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Posts</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New post</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted"><Spinner /></div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">No posts yet — create your first one.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-center gap-4 pt-5">
                {p.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt="" className="hidden h-14 w-24 shrink-0 rounded-lg border border-border bg-white object-cover sm:block" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{p.title}</p>
                    {p.featured && <Badge tone="info">Featured</Badge>}
                    <Badge tone={p.published ? "success" : "muted"}>{p.published ? "Published" : "Draft"}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {p.category?.name || "Uncategorized"} · {p.tags.length} tags · {p.likes} likes · {p._count?.reviews ?? 0} reviews
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/blog/${p.slug}`} target="_blank" className="p-2 text-muted hover:text-foreground" aria-label="View"><ExternalLink className="h-4 w-4" /></Link>
                  <button onClick={() => openEdit(p)} className="p-2 text-muted hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id, p.title)} className="p-2 text-muted hover:text-danger" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Edit post" : "New post"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Spinner />} {editId ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Excerpt"><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field>
          <Field label="Content (Markdown)">
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-48 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs outline-none focus:border-primary"
              placeholder="# Heading&#10;&#10;Write in markdown. Embed images with ![alt](/blog/xxx.svg)."
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Cover image URL" hint="e.g. /blog/xxx-flow.svg"><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></Field>
          </div>
          <Field label="Tags (comma-separated)"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ESP32, n8n, MQTT" /></Field>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> <Star className="h-3.5 w-3.5" /> Featured</label>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
