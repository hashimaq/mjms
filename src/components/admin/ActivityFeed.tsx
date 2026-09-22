import type { ActivityLogRow } from "@/lib/admin/types";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function actionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function projectFromMeta(metadata: Record<string, unknown>): string | null {
  const name = metadata.project_name;
  return typeof name === "string" && name.trim() ? name : null;
}

type ActivityFeedProps = {
  rows: ActivityLogRow[];
  compact?: boolean;
};

export function ActivityFeed({ rows, compact }: ActivityFeedProps) {
  if (rows.length === 0) {
    return (
      <div className="mjms-panel-empty" role="status">
        <p className="mjms-panel-empty-title">No activity yet</p>
        <p className="mjms-panel-empty-text">
          Catalogue changes from your team will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "mjms-activity-table-wrap mjms-activity-table-wrap--compact" : "mjms-activity-table-wrap"}>
      <table className="mjms-activity-table">
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Action</th>
            <th scope="col">Project</th>
            <th scope="col">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const name = row.profiles?.full_name || "User";
            const project = projectFromMeta(row.metadata);
            return (
              <tr key={row.id}>
                <td className="mjms-activity-cell-who">{name}</td>
                <td className="mjms-activity-cell-what">{actionLabel(row.action)}</td>
                <td className="mjms-activity-cell-project">{project ?? "—"}</td>
                <td className="mjms-activity-cell-when">
                  <time dateTime={row.created_at}>{formatWhen(row.created_at)}</time>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
