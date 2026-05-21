import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { api, type NotificationService, type NotificationServiceInput, type Project } from "../api.js";
import { logout } from "../auth-client.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../components/ThemeToggle.js";

// ── Notification service form (shared by create and edit) ──────────────────

const EMPTY_FORM: NotificationServiceInput = {
  name: "",
  smtp_host: "",
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: "",
  smtp_pass: "",
  from_address: "",
  to_address: "",
};

function ServiceForm({
  initial,
  serviceId,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: NotificationServiceInput;
  serviceId?: string;
  onSave: (data: NotificationServiceInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  function set(field: keyof NotificationServiceInput, value: string | number | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setTestStatus("idle");
  }

  async function handleTest(e: React.MouseEvent) {
    e.preventDefault();
    setTestStatus("sending");
    setTestError(null);
    try {
      const result = await api.testNotificationService({ ...form, id: serviceId });
      if (result.ok) {
        setTestStatus("ok");
      } else {
        setTestStatus("fail");
        setTestError(result.error ?? "Unknown error");
      }
    } catch (err) {
      setTestStatus("fail");
      setTestError((err as Error).message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="svc-name">Service name</Label>
          <Input
            id="svc-name"
            placeholder="e.g. My Gmail"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-host">SMTP host</Label>
          <Input
            id="svc-host"
            placeholder="smtp.example.com"
            value={form.smtp_host}
            onChange={(e) => set("smtp_host", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-port">Port</Label>
          <Input
            id="svc-port"
            type="number"
            min={1}
            max={65535}
            value={form.smtp_port}
            onChange={(e) => set("smtp_port", Number(e.target.value))}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-user">Username</Label>
          <Input
            id="svc-user"
            placeholder="user@example.com"
            value={form.smtp_user}
            onChange={(e) => set("smtp_user", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-pass">Password</Label>
          <Input
            id="svc-pass"
            type="password"
            placeholder={initial.smtp_pass === "***" ? "unchanged" : ""}
            value={form.smtp_pass}
            onChange={(e) => set("smtp_pass", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-from">From address</Label>
          <Input
            id="svc-from"
            type="email"
            placeholder="noreply@example.com"
            value={form.from_address}
            onChange={(e) => set("from_address", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-to">To address</Label>
          <Input
            id="svc-to"
            type="email"
            placeholder="you@example.com"
            value={form.to_address}
            onChange={(e) => set("to_address", e.target.value)}
            required
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            id="svc-secure"
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={form.smtp_secure}
            onChange={(e) => set("smtp_secure", e.target.checked)}
          />
          <Label htmlFor="svc-secure" className="font-normal cursor-pointer">
            Use TLS (port 465)
          </Label>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={testStatus === "sending" || !form.smtp_host.trim()}
            onClick={handleTest}
          >
            {testStatus === "sending" ? "Sending…" : "Test connection"}
          </Button>
          {testStatus === "ok" && (
            <span className="text-sm text-green-600 dark:text-green-400">
              Test email sent!
            </span>
          )}
          {testStatus === "fail" && (
            <span className="text-sm text-destructive" title={testError ?? undefined}>
              {testError ? `Failed: ${testError}` : "Test failed"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : "Save service"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Notification Services management dialog ────────────────────────────────

function NotificationServicesDialog() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<NotificationService[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  function load() {
    api
      .listNotificationServices()
      .then(setServices)
      .catch((e) => setListError(e.message));
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function handleCreate(data: NotificationServiceInput) {
    setSaving(true);
    setFormError(null);
    try {
      await api.createNotificationService(data);
      setAdding(false);
      load();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, data: NotificationServiceInput) {
    setSaving(true);
    setFormError(null);
    try {
      await api.updateNotificationService(id, data);
      setEditingId(null);
      load();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteNotificationService(id);
      setDeleteId(null);
      load();
    } catch (e) {
      setListError((e as Error).message);
    }
  }

  const deleteTarget = services.find((s) => s.id === deleteId);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Notification services">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notification services</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification services</DialogTitle>
            <DialogDescription>
              Configure email services that can be linked to projects. When
              feedback arrives for a linked project, an email is sent.
            </DialogDescription>
          </DialogHeader>

          {listError && (
            <p className="text-sm text-destructive">{listError}</p>
          )}

          <div className="flex flex-col gap-4">
            {services.map((svc) =>
              editingId === svc.id ? (
                <div key={svc.id} className="rounded-md border p-4">
                  <ServiceForm
                    initial={{
                      name: svc.name,
                      smtp_host: svc.smtp_host,
                      smtp_port: svc.smtp_port,
                      smtp_secure: svc.smtp_secure === 1,
                      smtp_user: svc.smtp_user,
                      smtp_pass: svc.smtp_pass,
                      from_address: svc.from_address,
                      to_address: svc.to_address,
                    }}
                    serviceId={svc.id}
                    onSave={(data) => handleUpdate(svc.id, data)}
                    onCancel={() => {
                      setEditingId(null);
                      setFormError(null);
                    }}
                    saving={saving}
                    error={formError}
                  />
                </div>
              ) : (
                <div
                  key={svc.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{svc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {svc.smtp_host}:{svc.smtp_port} · {svc.from_address} → {svc.to_address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(svc.id);
                        setFormError(null);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(svc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ),
            )}

            {services.length === 0 && !adding && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notification services configured yet.
              </p>
            )}

            {adding ? (
              <div className="rounded-md border p-4">
                <p className="text-sm font-medium mb-3">New service</p>
                <ServiceForm
                  initial={EMPTY_FORM}
                  onSave={handleCreate}
                  onCancel={() => {
                    setAdding(false);
                    setFormError(null);
                  }}
                  saving={saving}
                  error={formError}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                className="self-start"
                onClick={() => {
                  setAdding(true);
                  setFormError(null);
                }}
              >
                Add service
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete notification service</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">{deleteTarget?.name}</span> and
              remove it from all linked projects. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Per-project notifications dialog ──────────────────────────────────────

function ProjectNotificationsDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [allServices, setAllServices] = useState<NotificationService[]>([]);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.listNotificationServices(),
      api.getProjectNotificationServices(project.id),
    ])
      .then(([all, projectLinked]) => {
        setAllServices(all);
        setLinked(new Set(projectLinked.map((s) => s.id)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [project.id]);

  function toggle(id: string) {
    setLinked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.setProjectNotificationServices(project.id, [...linked]);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Notifications — {project.name}</DialogTitle>
        <DialogDescription>
          Select which notification services should be triggered when feedback
          arrives for this project.
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Loading…
        </p>
      ) : allServices.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No notification services configured yet. Set them up using the{" "}
          <Bell className="inline h-3.5 w-3.5" /> button in the page header.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {allServices.map((svc) => (
            <label
              key={svc.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-muted/50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                checked={linked.has(svc.id)}
                onChange={() => toggle(svc.id)}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{svc.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  → {svc.to_address}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving || loading || allServices.length === 0}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ── Main Projects page ─────────────────────────────────────────────────────

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectForNotifications, setProjectForNotifications] =
    useState<Project | null>(null);

  function load() {
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createProject(name.trim());
    setName("");
    setOpen(false);
    load();
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    if (!projectToRename || !renameValue.trim()) return;
    try {
      await api.updateProject(projectToRename.id, renameValue.trim());
      setProjectToRename(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function confirmDelete() {
    if (!projectToDelete) return;
    try {
      await api.deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Give your project a name. You can add API keys to it
                  afterwards.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={create} className="flex flex-col gap-4">
                <Input
                  autoFocus
                  placeholder="New project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!name.trim()}>
                    Create project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <NotificationServicesDialog />
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => logout().then(() => location.reload())}
          >
            Sign out
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Project ID</TableHead>
                <TableHead className="text-right">Feedback</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Created</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <TableCell className="font-semibold max-w-[8rem] sm:max-w-none truncate">
                    <span className="flex items-center gap-1.5">
                      {p.name}
                      {p.notification_service_count > 0 && (
                        <Bell
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          aria-label={`${p.notification_service_count} notification service${p.notification_service_count > 1 ? "s" : ""} linked`}
                        />
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground max-w-[12rem] truncate">
                    {p.id}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.feedback_count}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-muted-foreground whitespace-nowrap">
                    {new Date(p.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-my-2 h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Project actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setProjectToRename(p);
                            setRenameValue(p.name);
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setProjectForNotifications(p)}
                        >
                          Notifications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setProjectToDelete(p)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No projects yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Rename dialog */}
      <Dialog
        open={!!projectToRename}
        onOpenChange={(o) => !o && setProjectToRename(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Choose a new name for this project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={rename} className="flex flex-col gap-4">
            <Input
              autoFocus
              placeholder="Project name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProjectToRename(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !renameValue.trim() ||
                  renameValue.trim() === projectToRename?.name
                }
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={!!projectToDelete}
        onOpenChange={(o) => !o && setProjectToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              This permanently deletes{" "}
              <span className="font-semibold">{projectToDelete?.name}</span>{" "}
              along with its API keys and feedback. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProjectToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project notifications dialog */}
      <Dialog
        open={!!projectForNotifications}
        onOpenChange={(o) => {
          if (!o) {
            setProjectForNotifications(null);
            load();
          }
        }}
      >
        {projectForNotifications && (
          <ProjectNotificationsDialog
            project={projectForNotifications}
            onClose={() => {
              setProjectForNotifications(null);
              load();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
