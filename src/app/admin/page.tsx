import { redirect } from "next/navigation";
import { getAllExpenses, getItemsByCategory } from "@/lib/sheets";
import AdminTabs from "./AdminTabs";

interface PageProps {
  searchParams: Promise<{ key?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { key } = await searchParams;

  if (!process.env.STATS_SECRET || key !== process.env.STATS_SECRET) {
    redirect("/");
  }

  const [expenses, itemsByCategory] = await Promise.all([
    getAllExpenses(),
    getItemsByCategory(),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">管理後台</h1>
      <AdminTabs
        secretKey={key}
        expenses={expenses}
        initialItems={itemsByCategory}
      />
    </main>
  );
}
