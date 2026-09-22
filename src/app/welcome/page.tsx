import { WelcomeExperience } from "@/components/auth/WelcomeExperience";
import { WELCOME_PENDING_COOKIE } from "@/lib/auth/welcome-cookie";
import { getAuthenticatedUser, roleHomePath } from "@/lib/auth/guards";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

function safeInternalPath(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (value.startsWith("/login") || value.startsWith("/welcome")) {
    return fallback;
  }
  return value;
}

export default async function WelcomePage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const pending = cookieStore.get(WELCOME_PENDING_COOKIE)?.value;

  const home = roleHomePath(user.role);
  const raw = await searchParams;
  const destination = safeInternalPath(raw.next, home);

  if (!pending) {
    redirect(destination);
  }

  return (
    <WelcomeExperience fullName={user.fullName} destination={destination} />
  );
}
