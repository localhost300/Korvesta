import { AdminApp } from "@/components/admin/AdminApp";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/current-user";

export default async function AdminPage() {
  if (await getCurrentRole() !== "admin") redirect("/admin-sign-in");
  return <AdminApp/>;
}
