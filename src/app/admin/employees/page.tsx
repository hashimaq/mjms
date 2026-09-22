import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { fetchEmployeesList } from "@/lib/admin/queries";
import { getAdminSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

export default async function AdminEmployeesPage() {
  const { supabase } = await getAdminSupabase();
  const employees = await fetchEmployeesList(supabase);

  return (
    <>
      <WorkspacePageHeader
        variant="hero"
        eyebrow="Management"
        title="Employees"
        lead="Team members, catalogue contributions, and recent activity."
      />

      {employees.length === 0 ? (
        <div className="mjms-panel-empty" role="status">
          <p className="mjms-panel-empty-title">No employee profiles</p>
          <p className="mjms-panel-empty-text">
            Run bootstrap or invite staff through Supabase Auth.
          </p>
        </div>
      ) : (
        <div className="mjms-panel">
          <div className="mjms-data-table-wrap">
            <table className="mjms-data-table">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Email</th>
                  <th scope="col">Added</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Photos</th>
                  <th scope="col">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <Link href={`/admin/employees/${emp.id}`} className="mjms-data-table-link">
                        {emp.full_name || "Unnamed user"}
                      </Link>
                      <p className="mjms-table-submeta">Employee</p>
                    </td>
                    <td>{emp.email || "—"}</td>
                    <td>{emp.productsAdded}</td>
                    <td>{emp.productsUpdated}</td>
                    <td>{emp.photosUploaded}</td>
                    <td>
                      {emp.lastActivityAt
                        ? new Date(emp.lastActivityAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
