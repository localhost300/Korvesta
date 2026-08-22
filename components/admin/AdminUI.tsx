"use client";

import type { Icon } from "@tabler/icons-react";
import { IconX } from "@tabler/icons-react";
import { clsx } from "clsx";
import { Sparkline } from "@/components/Charts";

export function AdminCard({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return <section className={clsx("dash-card", className)}>{title || action ? <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-[15px] font-semibold">{title}</h2>{action}</div> : null}{children}</section>;
}

export function AdminHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-[28px]">{title}</h1><p className="mt-1 text-sm text-[var(--dash-muted)]">{subtitle}</p></div>{action}</div>;
}

export function AdminMetric({ label, value, change, icon: Icon, colour = "#ffc400", series = [10, 13, 12, 16, 19, 18, 23, 28] }: { label: string; value: string; change?: string; icon?: Icon; colour?: string; series?: number[] }) {
  return <AdminCard className="min-h-[126px] overflow-hidden"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[var(--dash-muted)]">{label}</p><p className="metric-value mt-3 text-[23px] font-semibold">{value}</p>{change ? <p className="mt-1 text-[11px] font-medium" style={{ color: change.startsWith("-") ? "#ef4444" : "#00d084" }}>{change}</p> : null}</div>{Icon ? <span className="grid size-10 place-items-center rounded-full" style={{ color: colour, background: `${colour}16`, border: `1px solid ${colour}35` }}><Icon size={20}/></span> : null}</div><div className="mt-2 h-8 opacity-80"><Sparkline data={series} positive={colour !== "#ef4444"} colour={colour} height={42}/></div></AdminCard>;
}

export function AdminStatus({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "yellow" | "red" | "purple" }) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

export function AdminTable({ headers, rows, compact = false }: { headers: string[]; rows: React.ReactNode[][]; compact?: boolean }) {
  return <div className="overflow-x-auto scrollbar-none"><table className={clsx("dash-table", compact && "dash-table-compact")}><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function AdminModal({ title, copy, close, children, size = "md" }: { title: string; copy?: string; close: () => void; children: React.ReactNode; size?: "md" | "lg" | "xl" }) {
  const width = size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-3xl" : "max-w-lg";
  return <div className="fixed inset-0 z-[140] grid place-items-center bg-black/75 p-3 backdrop-blur-sm sm:p-5" onMouseDown={close}><section role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()} className={clsx("dash-card max-h-[94vh] w-full overflow-y-auto p-0 shadow-2xl", width)}><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--dash-line)] bg-[var(--dash-card)] px-5 py-4"><div><h2 className="text-lg font-semibold">{title}</h2>{copy ? <p className="mt-1 text-xs text-[var(--dash-muted)]">{copy}</p> : null}</div><button type="button" onClick={close} className="grid size-8 place-items-center rounded-lg border border-[var(--dash-line)]" aria-label="Close"><IconX size={17}/></button></div><div className="p-5">{children}</div></section></div>;
}

export function AdminTabs({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-1 scrollbar-none">{options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={clsx("shrink-0 rounded-md px-3 py-1.5 text-[11px] font-medium transition", value === option ? "bg-[#ffc400] text-black" : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]")}>{option}</button>)}</div>;
}

export function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs text-[var(--dash-muted)]">{label}<span className="mt-2 block">{children}</span></label>;
}

export function ConfirmBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#ffc40045] bg-[#ffc40008] p-4 text-xs leading-5 text-[var(--dash-muted)]">{children}</div>;
}
