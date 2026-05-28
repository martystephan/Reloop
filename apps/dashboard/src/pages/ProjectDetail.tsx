import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ImageIcon, MoreHorizontal } from "lucide-react";
import {
  api,
  type ApiKey,
  type Submission,
  type SubmissionDetail,
  type SubmissionStatus,
  type SubmissionType,
} from "../api.js";
import { CopyButton } from "../components/CopyButton.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SUBMISSION_TYPES: { value: SubmissionType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feedback", label: "Feedback" },
  { value: "waitlist", label: "Waitlist" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
];

const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

function summarize(s: Submission): string {
  return s.subject ?? s.email ?? s.message ?? "—";
}

export function ProjectDetail() {
  const { id = "" } = useParams();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    api
      .listProjects()
      .then((projects) => setName(projects.find((p) => p.id === id)?.name ?? null))
      .catch(() => setName(null));
  }, [id]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Projects
        </Link>
        <ThemeToggle />
      </div>
      <h1 className="mt-2 text-xl font-semibold tracking-tight">
        {name ?? "Project"}
      </h1>
      <Tabs defaultValue="submissions" className="mt-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions">
          <SubmissionsTab projectId={id} />
        </TabsContent>
        <TabsContent value="keys">
          <KeysTab projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const STATUS_BADGE: Record<SubmissionStatus, string> = {
  new: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  resolved: "bg-green-500/15 text-green-600 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Badge variant="outline" className={`capitalize ${STATUS_BADGE[status]}`}>
      {status}
    </Badge>
  );
}

const PAGE_SIZE = 25;

function SubmissionsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [keyFilter, setKeyFilter] = useState("all");
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);

  useEffect(() => {
    api
      .listKeys(projectId)
      .then(setKeys)
      .catch(() => setKeys([]));
  }, [projectId]);

  function load() {
    api
      .listSubmissions(projectId, {
        type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        keyId: keyFilter === "all" ? undefined : keyFilter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      });
  }
  useEffect(load, [projectId, page, typeFilter, statusFilter, keyFilter]);

  // Changing a filter resets to the first page.
  function setFilter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(0);
    };
  }

  function openDetail(id: string) {
    api
      .getSubmission(id)
      .then(setSelected)
      .catch(() => setSelected(null));
  }

  function applyStatus(id: string, status: SubmissionStatus) {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  }

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={typeFilter} onValueChange={setFilter(setTypeFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {SUBMISSION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setFilter(setStatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SUBMISSION_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={keyFilter} onValueChange={setFilter(setKeyFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All keys</SelectItem>
            {keys.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name}
                {k.revoked_at ? " (revoked)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="hidden md:table-cell w-40">Source key</TableHead>
              <TableHead className="hidden sm:table-cell w-44">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => openDetail(s.id)}
              >
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {s.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-0">
                  <div
                    className="flex items-center gap-1.5 truncate"
                    title={summarize(s)}
                  >
                    {s.has_screenshot === 1 && (
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{summarize(s)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell truncate max-w-[10rem] text-muted-foreground">
                  {s.api_key_name ?? "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                  {new Date(s.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No submissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total === 0 ? "No submissions" : `Showing ${start}–${end} of ${total}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={end >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {selected && (
        <SubmissionModal
          submission={selected}
          onClose={() => setSelected(null)}
          onStatusChange={applyStatus}
        />
      )}
    </>
  );
}

function SubmissionModal({
  submission,
  onClose,
  onStatusChange,
}: {
  submission: SubmissionDetail;
  onClose: () => void;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}) {
  let meta = submission.meta;
  try {
    if (meta) meta = JSON.stringify(JSON.parse(meta), null, 2);
  } catch {
    /* leave raw */
  }

  async function changeStatus(status: SubmissionStatus) {
    onStatusChange(submission.id, status); // optimistic
    try {
      await api.updateSubmissionStatus(submission.id, status);
    } catch {
      /* keep optimistic value; list reload will reconcile */
    }
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Type",
      value: (
        <Badge variant="secondary" className="capitalize">
          {submission.type}
        </Badge>
      ),
    },
  ];
  if (submission.subject) {
    rows.push({ label: "Subject", value: submission.subject });
  }
  if (submission.email) {
    rows.push({ label: "Email", value: submission.email });
  }
  rows.push(
    { label: "Source key", value: submission.api_key_name ?? "—" },
    { label: "Date", value: new Date(submission.created_at).toLocaleString() },
    { label: "ID", value: <code className="text-xs">{submission.id}</code> },
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submission details</DialogTitle>
          <DialogDescription>
            Submitted {new Date(submission.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={submission.status} onValueChange={changeStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {submission.message && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Message
              </p>
              <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {submission.message}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-[7rem_1fr] sm:gap-x-4">
            {rows.map((r) => (
              <div key={r.label} className="sm:contents">
                <dt className="text-muted-foreground">{r.label}</dt>
                <dd className="break-words">{r.value}</dd>
              </div>
            ))}
          </dl>

          {meta && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Metadata
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-xs">
                {meta}
              </pre>
            </div>
          )}

          {submission.screenshot && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Screenshot
              </p>
              <a href={submission.screenshot} target="_blank" rel="noreferrer">
                <img
                  src={submission.screenshot}
                  alt="Submission screenshot"
                  className="max-h-96 w-full rounded-md border object-contain"
                />
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeysTab({ projectId }: { projectId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  function load() {
    api
      .listKeys(projectId)
      .then(setKeys)
      .catch(() => setKeys([]));
  }
  useEffect(load, [projectId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await api.createKey(projectId, name.trim());
    setName("");
    setOpen(false);
    setSecret(res.secret);
    load();
  }

  async function revoke() {
    if (!keyToRevoke) return;
    await api.revokeKey(keyToRevoke.id);
    setKeyToRevoke(null);
    load();
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Give the key a name so you can recognize where it's used. A key
                can send any submission type.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={create} className="flex flex-col gap-4">
              <Input
                autoFocus
                placeholder="Key name (e.g. Production web)"
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
                  Create key
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium max-w-[8rem] truncate">{k.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {k.prefix}
                  </code>
                </TableCell>
                <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                  {k.revoked_at
                    ? "Revoked"
                    : k.last_used_at
                      ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}`
                      : "Never used"}
                </TableCell>
                <TableCell className="text-right">
                  {!k.revoked_at && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-my-2 h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Key actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setKeyToRevoke(k)}
                        >
                          Revoke key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {keys.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No keys yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {secret && (
        <SecretModal secret={secret} onClose={() => setSecret(null)} />
      )}

      <Dialog
        open={keyToRevoke !== null}
        onOpenChange={(o) => !o && setKeyToRevoke(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API key</DialogTitle>
            <DialogDescription>
              Revoke{" "}
              <span className="font-medium text-foreground">
                {keyToRevoke?.name}
              </span>
              ? SDKs using it will stop working immediately. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToRevoke(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke}>
              Revoke key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SecretModal({
  secret,
  onClose,
}: {
  secret: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your new API key</DialogTitle>
          <DialogDescription>
            Copy it now — for security it will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-sm">
          {secret}
        </pre>
        <CopyButton text={secret} label="Copy key" />
        <p className="text-sm text-muted-foreground">
          Next steps: see the{" "}
          <a
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={import.meta.env.VITE_DOCS_URL ?? "http://localhost:3000"}
            target="_blank"
            rel="noreferrer"
          >
            SDK documentation
          </a>{" "}
          for how to wire this key into your app.
        </p>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
