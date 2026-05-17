import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Project } from "../api.js";
import { logout } from "../auth-client.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ThemeToggle } from "../components/ThemeToggle.js";

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex items-center justify-between">
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

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Project ID</TableHead>
              <TableHead className="text-right">Feedback</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <TableCell className="font-semibold">{p.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.id}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.feedback_count}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
