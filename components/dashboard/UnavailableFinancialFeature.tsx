"use client";
import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { Card, PageHeading } from "./DashboardUI";

export function UnavailableFinancialFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <PageHeading
        title={title}
        subtitle="This feature is not currently available."
      />
      <Card className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#ffc40014] text-[#ffc400]">
          <IconLock size={30} />
        </span>
        <h2 className="mt-5 text-xl font-semibold">
          No live integration configured
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#819099]">
          {description}
        </p>
        <p className="mt-4 text-xs text-[#819099]">
          No balances, performance, positions, or returns are being simulated on
          this page.
        </p>
        <Link href="/dashboard" className="gold-button mt-6">
          Return to dashboard
        </Link>
      </Card>
    </>
  );
}
