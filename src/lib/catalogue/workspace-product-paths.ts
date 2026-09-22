export function workspaceNewProductPath(role: "admin" | "staff"): string {
  return role === "admin" ? "/admin/products/new" : "/employee/products/new";
}

export function workspaceEditProductPath(role: "admin" | "staff", articleId: string): string {
  return role === "admin"
    ? `/admin/products/${articleId}/edit`
    : `/employee/products/${articleId}/edit`;
}
