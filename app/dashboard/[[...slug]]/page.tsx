import { DashboardApp } from "@/components/dashboard/DashboardApp";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/current-user";

export default async function DashboardPage() {
  if (await getCurrentRole() !== "customer") redirect("/sign-in");
  return <DashboardApp/>;
}
