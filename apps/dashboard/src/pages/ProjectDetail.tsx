import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { api, type ApiKey, type FeedbackItem } from "../api.js";
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
      <Tabs defaultValue="feedback" className="mt-4">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback">
          <FeedbackTab projectId={id} />
        </TabsContent>
        <TabsContent value="keys">
          <KeysTab projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeedbackTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    api
      .listFeedback(projectId, filter === "all" ? undefined : filter)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [projectId, filter]);

  return (
    <>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="mb-4 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="idea">Idea</SelectItem>
          <SelectItem value="praise">Praise</SelectItem>
          <SelectItem value="rating">Rating</SelectItem>
        </SelectContent>
      </Select>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-40">Source key</TableHead>
              <TableHead className="w-20">Rating</TableHead>
              <TableHead className="w-44">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((f) => (
              <TableRow
                key={f.id}
                className="cursor-pointer"
                onClick={() => setSelected(f)}
              >
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {f.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-0">
                  <div
                    className="truncate"
                    title={f.url ? `${f.message} — ${f.url}` : f.message}
                  >
                    {f.message}
                    {f.url && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {f.url}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.api_key_name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.rating != null ? `${f.rating}/5` : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(f.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No feedback yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {selected && (
        <FeedbackModal
          feedback={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function FeedbackModal({
  feedback,
  onClose,
}: {
  feedback: FeedbackItem;
  onClose: () => void;
}) {
  let meta = feedback.user_meta;
  try {
    if (meta) meta = JSON.stringify(JSON.parse(meta), null, 2);
  } catch {
    /* leave raw */
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Type",
      value: (
        <Badge variant="secondary" className="capitalize">
          {feedback.type}
        </Badge>
      ),
    },
    {
      label: "Rating",
      value: feedback.rating != null ? `${feedback.rating}/5` : "—",
    },
    {
      label: "URL",
      value: feedback.url ? (
        <a
          href={feedback.url}
          target="_blank"
          rel="noreferrer"
          className="break-all font-medium text-primary underline-offset-4 hover:underline"
        >
          {feedback.url}
        </a>
      ) : (
        "—"
      ),
    },
    { label: "Source key", value: feedback.api_key_name ?? "—" },
    {
      label: "Date",
      value: new Date(feedback.created_at).toLocaleString(),
    },
    { label: "ID", value: <code className="text-xs">{feedback.id}</code> },
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback details</DialogTitle>
          <DialogDescription>
            Submitted {new Date(feedback.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Message
            </p>
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {feedback.message}
            </p>
          </div>

          <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-sm">
            {rows.map((r) => (
              <div key={r.label} className="contents">
                <dt className="text-muted-foreground">{r.label}</dt>
                <dd className="break-words">{r.value}</dd>
              </div>
            ))}
          </dl>

          {feedback.user_meta && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                User metadata
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-xs">
                {meta}
              </pre>
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
                Give the key a name so you can recognize where it's used.
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {k.prefix}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">
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
