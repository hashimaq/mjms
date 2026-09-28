import { ProductAssistantLauncher } from "@/components/catalogue/assistant/ProductAssistantLauncher";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProductAssistantLauncher />
    </>
  );
}
