"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCallback, useState } from "react";

type ProjectFormProps = {
  mode: "create" | "edit";
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}

export function ProjectForm({
  mode,
  initialName = "",
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Project name is required.");
        return;
      }
      if (trimmed.length < 2) {
        setError("Project name must be at least 2 characters.");
        return;
      }

      setError(null);
      setLoading(true);
      try {
        await onSubmit(trimmed);
        setSuccess(true);
      } catch (err: unknown) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [name, onSubmit]
  );

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="space-y-5"
    >
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
          setSuccess(false);
        }}
        placeholder="e.g. BIANCA"
        autoFocus
        error={error ?? undefined}
        disabled={loading}
      />

      {success && (
        <p className="mjms-alert mjms-alert-success" role="status">
          Project {mode === "create" ? "created" : "updated"} successfully.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => onCancel()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {mode === "create" ? "Create Project" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
