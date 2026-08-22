"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
  IconBan,
  IconBriefcase,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconDownload,
  IconEdit,
  IconEye,
  IconFileDescription,
  IconFilter,
  IconIdBadge2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconTrendingUp,
  IconUserPlus,
  IconUsers,
  IconWallet,
  IconX,
} from "@tabler/icons-react";
import { InteractiveChart } from "@/components/dashboard/InteractiveChart";
import {
  adminOverviewSeries,
  initialCustomers,
  initialInvestmentPlans,
  initialKycApplications,
  initialPayments,
  revenueSeries,
  type AdminCustomer,
  type AdminInvestmentPlan,
  type AdminPayment,
  type KycApplication,
} from "@/lib/admin-data";
import { AdminCard, AdminHeading, AdminMetric, AdminModal, AdminStatus, AdminTable, AdminTabs, ConfirmBox, FieldLabel } from "./AdminUI";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function toneForStatus(status: string): "green" | "yellow" | "red" | "purple" {
  if (["Active", "Approved", "Verified", "Completed", "Low"].includes(status)) return "green";
  if (["Pending", "Paused", "Restricted", "Medium", "Resubmission"].includes(status)) return "yellow";
  if (["Rejected", "Suspended", "High"].includes(status)) return "red";
  return "purple";
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const activityRows = [
  ["New deposit submitted", "Amina Yusuf · $12,500", "14m", "Payments"],
  ["KYC application received", "Daniel Mensah · Level 2", "28m", "Compliance"],
  ["Investment activated", "Alex Johnson · Balanced Growth", "42m", "Investments"],
  ["Withdrawal approved", "Grace Wanjiku · $3,750", "1h", "Payments"],
  ["Account restricted", "Ibrahim Bello · Risk review", "2h", "Security"],
];

export function AdminOverviewPage() {
  const [timeframe, setTimeframe] = useState("30D");
  return <><AdminHeading title="Operations Overview" subtitle="Monitor customers, funds, compliance and platform activity from one workspace." action={<div className="flex flex-wrap gap-2"><Link href="/admin/reports" className="dash-button"><IconDownload size={16}/>Export report</Link><Link href="/admin/customers" className="gold-button"><IconUserPlus size={16}/>Manage customers</Link></div>}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Assets Under Management" value="$18.42M" change="+8.24% this month" icon={IconWallet}/><AdminMetric label="Active Customers" value="4,286" change="+184 this month" icon={IconUsers} colour="#2f80ed"/><AdminMetric label="Pending Approvals" value="28" change="12 payments · 16 KYC" icon={IconClock} colour="#8b5cf6"/><AdminMetric label="Platform Revenue" value="$284,620" change="+12.45% this month" icon={IconTrendingUp} colour="#00d084"/></div><div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.75fr]"><AdminCard title="Assets and Net Flows" action={<AdminTabs options={["7D", "30D", "90D", "1Y"]} value={timeframe} onChange={setTimeframe}/>}><div className="mb-2 flex flex-wrap items-end gap-6"><div><small className="text-[var(--dash-muted)]">Total assets · {timeframe}</small><p className="metric-value mt-1 text-3xl font-semibold">$18,420,680.50</p></div><div><small className="text-[var(--dash-muted)]">Net inflow</small><p className="mt-1 text-base font-semibold text-[#00d084]">+$1,248,520.20</p></div></div><InteractiveChart data={adminOverviewSeries} symbol="Assets under management" height={300} defaultTimeframe="1M"/></AdminCard><AdminCard title="Approval Queue" action={<Link href="/admin/payments" className="text-xs font-semibold text-[#ffc400]">Review all →</Link>}><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4"><IconArrowDown className="text-[#00d084]" size={20}/><p className="mt-3 text-2xl font-semibold">7</p><small className="text-[var(--dash-muted)]">Deposits</small></div><div className="rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4"><IconArrowUp className="text-[#ffc400]" size={20}/><p className="mt-3 text-2xl font-semibold">5</p><small className="text-[var(--dash-muted)]">Withdrawals</small></div><div className="rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4"><IconIdBadge2 className="text-[#8b5cf6]" size={20}/><p className="mt-3 text-2xl font-semibold">16</p><small className="text-[var(--dash-muted)]">KYC reviews</small></div><div className="rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4"><IconAlertTriangle className="text-[#ef4444]" size={20}/><p className="mt-3 text-2xl font-semibold">3</p><small className="text-[var(--dash-muted)]">Risk cases</small></div></div><Link href="/admin/kyc" className="gold-button mt-4 w-full">Open operations queue</Link></AdminCard></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><AdminCard className="lg:col-span-2" title="Recent Platform Activity"><AdminTable compact headers={["Event", "Details", "Time", "Area"]} rows={activityRows.map(([event, detail, time, area]) => [<span key="event" className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#00d084]"/><b>{event}</b></span>, detail, time, <AdminStatus key="area" tone={area === "Security" ? "red" : area === "Compliance" ? "purple" : "green"}>{area}</AdminStatus>])}/></AdminCard><AdminCard title="Revenue Breakdown"><div className="h-32"><InteractiveChart data={revenueSeries} symbol="Revenue" height={130} colour="#8b5cf6" timeframes={["30D"]} defaultTimeframe="30D"/></div>{[["Trading fees", "$124,850", "43.9%"], ["Investment fees", "$82,420", "29.0%"], ["Withdrawal fees", "$42,250", "14.8%"], ["Other revenue", "$35,100", "12.3%"]].map(([label, value, share]) => <div key={label} className="flex items-center justify-between border-b border-[var(--dash-line)] py-3 text-xs last:border-0"><span className="text-[var(--dash-muted)]">{label}</span><span className="text-right"><b>{value}</b><small className="ml-2 text-[var(--dash-muted)]">{share}</small></span></div>)}</AdminCard></div></>;
}

type CustomerModal = { type: "view" | "edit" | "balance" | "status"; customer: AdminCustomer } | null;

export function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<CustomerModal>(null);
  const [notice, setNotice] = useState("");
  const [balanceKind, setBalanceKind] = useState<"Credit" | "Debit">("Credit");
  const [balanceArea, setBalanceArea] = useState<"Portfolio" | "Investment" | "Trading" | "Staking">("Portfolio");
  const [balanceAmount, setBalanceAmount] = useState("500");
  const [reason, setReason] = useState("");

  const visibleCustomers = useMemo(() => customers.filter((customer) => {
    const matchesQuery = `${customer.name} ${customer.email} ${customer.id}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" || customer.status === filter || customer.kyc === filter || customer.tier === filter;
    return matchesQuery && matchesFilter;
  }), [customers, query, filter]);

  const updateCustomer = (id: string, updater: (customer: AdminCustomer) => AdminCustomer) => setCustomers((current) => current.map((customer) => customer.id === id ? updater(customer) : customer));

  const submitBalance = () => {
    if (!modal || modal.type !== "balance") return;
    const amount = Number(balanceAmount);
    if (!Number.isFinite(amount) || amount <= 0 || reason.trim().length < 8) {
      setNotice("Enter a valid amount and an audit reason of at least eight characters.");
      return;
    }
    const delta = balanceKind === "Credit" ? amount : -amount;
    updateCustomer(modal.customer.id, (customer) => {
      const updated = { ...customer, portfolio: Math.max(0, customer.portfolio + delta) };
      if (balanceArea === "Investment") updated.investment = Math.max(0, customer.investment + delta);
      if (balanceArea === "Trading") updated.trading = Math.max(0, customer.trading + delta);
      if (balanceArea === "Staking") updated.staking = Math.max(0, customer.staking + delta);
      return updated;
    });
    setNotice(`${balanceKind} of ${money(amount)} applied to ${modal.customer.name}. Audit reference ADJ-${Date.now().toString().slice(-6)} created.`);
    setModal(null);
    setReason("");
  };

  return <><AdminHeading title="Customer Management" subtitle="Review profiles, edit customer information and control portfolio balances." action={<div className="flex gap-2"><button type="button" className="dash-button" onClick={() => downloadCsv("korvesta-customers.csv", [["ID", "Name", "Email", "Country", "Tier", "KYC", "Status", "Portfolio"], ...customers.map((customer) => [customer.id, customer.name, customer.email, customer.country, customer.tier, customer.kyc, customer.status, customer.portfolio])])}><IconDownload size={16}/>Export</button><button type="button" className="gold-button" onClick={() => setNotice("New customer invitations will be connected to the authentication service during backend integration.")}><IconUserPlus size={16}/>Invite customer</button></div>}/>{notice ? <div className={clsx("mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs", notice.startsWith("Enter") ? "border-[#ef444455] bg-[#ef444410] text-[#ef4444]" : "border-[#00d08455] bg-[#00d08410] text-[#00d084]")}><span>{notice}</span><button type="button" onClick={() => setNotice("")}><IconX size={15}/></button></div> : null}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Total Customers" value={customers.length.toLocaleString()} change="+184 this month" icon={IconUsers}/><AdminMetric label="Verified Customers" value={String(customers.filter((customer) => customer.kyc === "Verified").length)} change="72.4% verification rate" icon={IconShieldCheck} colour="#00d084"/><AdminMetric label="Restricted Accounts" value={String(customers.filter((customer) => customer.status === "Restricted").length)} change="Requires monitoring" icon={IconAlertTriangle} colour="#ffc400"/><AdminMetric label="Average Portfolio" value={money(customers.reduce((sum, customer) => sum + customer.portfolio, 0) / customers.length)} change="Across shown customers" icon={IconBriefcase} colour="#8b5cf6"/></div><AdminCard className="mt-4" title="All Customers"><div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dash-muted)]"/><input className="dash-input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or customer ID..."/></div><AdminTabs options={["All", "Active", "Restricted", "Suspended", "Verified", "Pending", "VIP"]} value={filter} onChange={setFilter}/><button type="button" className="dash-button"><IconFilter size={15}/>More filters</button></div><AdminTable headers={["Customer", "Country", "Tier", "KYC", "Status", "Portfolio", "Joined", "Actions"]} rows={visibleCustomers.map((customer) => [<span key="customer" className="flex min-w-[190px] items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffc40018] font-semibold text-[#ffc400]">{customer.name.split(" ").map((name) => name[0]).join("")}</span><span><b className="block">{customer.name}</b><small className="text-[var(--dash-muted)]">{customer.email}<br/>{customer.id}</small></span></span>, customer.country, <AdminStatus key="tier" tone={customer.tier === "VIP" ? "purple" : customer.tier === "Pro" ? "yellow" : "green"}>{customer.tier}</AdminStatus>, <AdminStatus key="kyc" tone={toneForStatus(customer.kyc)}>{customer.kyc}</AdminStatus>, <AdminStatus key="status" tone={toneForStatus(customer.status)}>{customer.status}</AdminStatus>, <b key="portfolio">{money(customer.portfolio)}</b>, customer.joined, <span key="actions" className="flex gap-1"><button type="button" onClick={() => setModal({ type: "view", customer })} className="admin-icon-button" aria-label={`View ${customer.name}`}><IconEye size={15}/></button><button type="button" onClick={() => setModal({ type: "edit", customer })} className="admin-icon-button" aria-label={`Edit ${customer.name}`}><IconEdit size={15}/></button><button type="button" onClick={() => setModal({ type: "balance", customer })} className="admin-icon-button text-[#ffc400]" aria-label={`Adjust ${customer.name} balance`}><IconWallet size={15}/></button><button type="button" onClick={() => setModal({ type: "status", customer })} className="admin-icon-button text-[#ef4444]" aria-label={`Change ${customer.name} status`}><IconBan size={15}/></button></span>])}/>{visibleCustomers.length === 0 ? <div className="py-12 text-center text-sm text-[var(--dash-muted)]">No customer matches the current search and filter.</div> : null}</AdminCard>{modal?.type === "view" ? <AdminModal title={modal.customer.name} copy={`${modal.customer.id} · Joined ${modal.customer.joined}`} close={() => setModal(null)} size="lg"><div className="grid gap-3 sm:grid-cols-4">{[["Portfolio", modal.customer.portfolio], ["Investments", modal.customer.investment], ["Trading", modal.customer.trading], ["Staking", modal.customer.staking]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4"><small className="text-[var(--dash-muted)]">{label}</small><b className="mt-2 block text-lg">{money(Number(value))}</b></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><AdminCard title="Profile information" className="shadow-none">{[["Email", modal.customer.email], ["Country", modal.customer.country], ["Membership", modal.customer.tier], ["KYC", modal.customer.kyc], ["Account status", modal.customer.status]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[var(--dash-line)] py-3 text-xs last:border-0"><span className="text-[var(--dash-muted)]">{label}</span><b>{value}</b></div>)}</AdminCard><AdminCard title="Administrative controls" className="shadow-none"><button type="button" className="dash-button w-full" onClick={() => setModal({ type: "edit", customer: modal.customer })}><IconEdit size={16}/>Edit customer details</button><button type="button" className="dash-button mt-2 w-full" onClick={() => setModal({ type: "balance", customer: modal.customer })}><IconWallet size={16}/>Adjust portfolio balance</button><Link href="/admin/transactions" className="dash-button mt-2 w-full"><IconActivity size={16}/>View transaction history</Link><button type="button" className="dash-button mt-2 w-full text-[#ef4444]" onClick={() => setModal({ type: "status", customer: modal.customer })}><IconBan size={16}/>Restrict or suspend</button></AdminCard></div></AdminModal> : null}{modal?.type === "edit" ? <AdminModal title="Edit customer details" copy={`Update ${modal.customer.name}'s account profile.`} close={() => setModal(null)}><div className="grid gap-4"><FieldLabel label="Full name"><input className="dash-input" defaultValue={modal.customer.name} id="admin-customer-name"/></FieldLabel><FieldLabel label="Email address"><input className="dash-input" defaultValue={modal.customer.email} type="email" id="admin-customer-email"/></FieldLabel><div className="grid grid-cols-2 gap-3"><FieldLabel label="Country"><select className="dash-input" defaultValue={modal.customer.country}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>South Africa</option></select></FieldLabel><FieldLabel label="Membership tier"><select className="dash-input" defaultValue={modal.customer.tier}><option>Standard</option><option>Pro</option><option>VIP</option></select></FieldLabel></div><FieldLabel label="Internal note"><textarea className="dash-input min-h-24 py-3" placeholder="Reason for the profile update..."/></FieldLabel><button type="button" className="gold-button w-full" onClick={() => { const name = (document.getElementById("admin-customer-name") as HTMLInputElement | null)?.value || modal.customer.name; const email = (document.getElementById("admin-customer-email") as HTMLInputElement | null)?.value || modal.customer.email; updateCustomer(modal.customer.id, (customer) => ({ ...customer, name, email })); setNotice(`${modal.customer.name}'s customer details were updated.`); setModal(null); }}><IconCheck size={16}/>Save customer changes</button></div></AdminModal> : null}{modal?.type === "balance" ? <AdminModal title="Adjust customer balance" copy={`${modal.customer.name} · Current portfolio ${money(modal.customer.portfolio)}`} close={() => setModal(null)}><ConfirmBox>Balance changes affect financial records. This prototype records the reason and displays a generated audit reference. Production must require authorised server-side approval.</ConfirmBox><div className="mt-4"><AdminTabs options={["Credit", "Debit"]} value={balanceKind} onChange={(value) => setBalanceKind(value as "Credit" | "Debit")}/></div><div className="mt-4 grid grid-cols-2 gap-3"><FieldLabel label="Balance area"><select className="dash-input" value={balanceArea} onChange={(event) => setBalanceArea(event.target.value as typeof balanceArea)}><option>Portfolio</option><option>Investment</option><option>Trading</option><option>Staking</option></select></FieldLabel><FieldLabel label="Amount (USD)"><input className="dash-input" value={balanceAmount} inputMode="decimal" onChange={(event) => setBalanceAmount(event.target.value)}/></FieldLabel></div><FieldLabel label="Audit reason"><textarea className="dash-input mt-4 min-h-24 py-3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this adjustment is authorised..."/></FieldLabel><div className="mt-4 flex justify-between rounded-xl border border-[var(--dash-line)] p-4 text-xs"><span className="text-[var(--dash-muted)]">Estimated portfolio after adjustment</span><b>{money(Math.max(0, modal.customer.portfolio + (balanceKind === "Credit" ? Number(balanceAmount) || 0 : -(Number(balanceAmount) || 0))))}</b></div><button type="button" className="gold-button mt-4 w-full" onClick={submitBalance}>Confirm balance adjustment</button></AdminModal> : null}{modal?.type === "status" ? <AdminModal title="Change account status" copy={`Apply an access control to ${modal.customer.name}.`} close={() => setModal(null)}><ConfirmBox>Restricted customers can view their accounts but cannot withdraw or trade. Suspended customers lose account access until an administrator restores it.</ConfirmBox><div className="mt-4 grid gap-2">{(["Active", "Restricted", "Suspended"] as const).map((status) => <button type="button" key={status} onClick={() => { updateCustomer(modal.customer.id, (customer) => ({ ...customer, status })); setNotice(`${modal.customer.name}'s account status changed to ${status}.`); setModal(null); }} className={clsx("flex items-center justify-between rounded-xl border p-4 text-left", modal.customer.status === status ? "border-[#ffc400] bg-[#ffc40008]" : "border-[var(--dash-line)]")}><span><b className="block text-sm">{status}</b><small className="mt-1 block text-[var(--dash-muted)]">{status === "Active" ? "Full approved account access" : status === "Restricted" ? "Read-only access and manual review" : "Block all customer access"}</small></span><AdminStatus tone={toneForStatus(status)}>{status}</AdminStatus></button>)}</div></AdminModal> : null}</>;
}

export function KycAdminPage() {
  const [applications, setApplications] = useState(initialKycApplications);
  const [filter, setFilter] = useState("Pending");
  const [selected, setSelected] = useState<KycApplication | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const shown = filter === "All" ? applications : applications.filter((application) => application.status === filter || application.risk === filter);
  const decide = (status: KycApplication["status"]) => {
    if (!selected) return;
    if ((status === "Rejected" || status === "Resubmission") && note.trim().length < 8) {
      setNotice("Add a clear compliance note before rejecting or requesting resubmission.");
      return;
    }
    setApplications((current) => current.map((application) => application.id === selected.id ? { ...application, status } : application));
    setNotice(`${selected.id} was marked ${status}. The decision was added to the compliance log.`);
    setSelected(null);
    setNote("");
  };
  return <><AdminHeading title="KYC & Compliance" subtitle="Review identity documents, risk signals and verification decisions." action={<button type="button" className="dash-button" onClick={() => downloadCsv("korvesta-kyc-report.csv", [["ID", "Customer", "Country", "Level", "Document", "Risk", "Status"], ...applications.map((application) => [application.id, application.customer, application.country, application.level, application.document, application.risk, application.status])])}><IconDownload size={16}/>Compliance report</button>}/>{notice ? <div className={clsx("mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs", notice.startsWith("Add") ? "border-[#ef444455] bg-[#ef444410] text-[#ef4444]" : "border-[#00d08455] bg-[#00d08410] text-[#00d084]")}><span>{notice}</span><button type="button" onClick={() => setNotice("")}><IconX size={15}/></button></div> : null}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Pending Review" value={String(applications.filter((item) => item.status === "Pending").length)} change="Oldest: 3 hours" icon={IconClock}/><AdminMetric label="Approved Today" value="42" change="94.8% approval rate" icon={IconCircleCheck} colour="#00d084"/><AdminMetric label="High-risk Cases" value={String(applications.filter((item) => item.risk === "High").length)} change="Manual review required" icon={IconAlertTriangle} colour="#ef4444"/><AdminMetric label="Average Review Time" value="6m 42s" change="-18% this week" icon={IconActivity} colour="#8b5cf6"/></div><AdminCard className="mt-4" title="Verification Queue"><div className="mb-4"><AdminTabs options={["All", "Pending", "Resubmission", "Approved", "Rejected", "High"]} value={filter} onChange={setFilter}/></div><AdminTable headers={["Application", "Customer", "Country", "Level", "Document", "Risk", "Submitted", "Status", "Action"]} rows={shown.map((application) => [<b key="id">{application.id}</b>, <span key="customer"><b className="block">{application.customer}</b><small className="text-[var(--dash-muted)]">{application.email}</small></span>, application.country, application.level, application.document, <AdminStatus key="risk" tone={toneForStatus(application.risk)}>{application.risk}</AdminStatus>, application.submitted, <AdminStatus key="status" tone={toneForStatus(application.status)}>{application.status}</AdminStatus>, <button key="action" type="button" onClick={() => setSelected(application)} className="dash-button min-h-8 px-3"><IconEye size={14}/>Review</button>])}/></AdminCard>{selected ? <AdminModal title={`Review ${selected.id}`} copy={`${selected.customer} · ${selected.level} verification`} close={() => setSelected(null)} size="lg"><div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]"><div><div className="grid aspect-[1.55] place-items-center rounded-xl border border-dashed border-[var(--dash-line)] bg-[var(--dash-card-2)] text-center"><div><IconFileDescription className="mx-auto text-[#ffc400]" size={42}/><b className="mt-3 block text-sm">{selected.document}</b><p className="mt-1 text-xs text-[var(--dash-muted)]">Secure document preview</p><button type="button" className="dash-button mt-4 min-h-8"><IconEye size={14}/>Open full document</button></div></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[var(--dash-line)] p-3"><small className="text-[var(--dash-muted)]">Face match</small><b className="mt-1 block text-sm text-[#00d084]">98.4%</b></div><div className="rounded-xl border border-[var(--dash-line)] p-3"><small className="text-[var(--dash-muted)]">Liveness</small><b className="mt-1 block text-sm text-[#00d084]">Passed</b></div></div></div><div><AdminCard title="Applicant checks" className="shadow-none">{[["Full name", selected.customer], ["Country", selected.country], ["Document", selected.document], ["Risk rating", selected.risk], ["Sanctions screening", "No match"], ["PEP screening", "No match"], ["Duplicate identity", "No match"]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[var(--dash-line)] py-3 text-xs last:border-0"><span className="text-[var(--dash-muted)]">{label}</span><b>{value}</b></div>)}</AdminCard><FieldLabel label="Compliance decision note"><textarea className="dash-input min-h-24 py-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required for rejection or resubmission..."/></FieldLabel></div></div><div className="mt-5 grid gap-2 sm:grid-cols-3"><button type="button" className="dash-button text-[#ef4444]" onClick={() => decide("Rejected")}><IconX size={16}/>Reject</button><button type="button" className="dash-button text-[#ffc400]" onClick={() => decide("Resubmission")}><IconRefresh size={16}/>Request resubmission</button><button type="button" className="gold-button" onClick={() => decide("Approved")}><IconCheck size={16}/>Approve KYC</button></div></AdminModal> : null}</>;
}

export function PaymentsPage() {
  const [payments, setPayments] = useState(initialPayments);
  const [filter, setFilter] = useState("Pending");
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const shown = filter === "All" ? payments : payments.filter((payment) => payment.status === filter || payment.type === filter);
  const decide = (status: AdminPayment["status"]) => {
    if (!selected) return;
    if (status === "Rejected" && note.trim().length < 8) {
      setNotice("Enter a rejection reason before declining this transaction.");
      return;
    }
    setPayments((current) => current.map((payment) => payment.id === selected.id ? { ...payment, status } : payment));
    setNotice(`${selected.id} was ${status.toLowerCase()}. The ledger and customer notification were queued.`);
    setSelected(null);
    setNote("");
  };
  return <><AdminHeading title="Deposits & Withdrawals" subtitle="Verify payment evidence, approve withdrawals and reconcile customer funds." action={<Link href="/admin/transactions" className="dash-button"><IconActivity size={16}/>Open ledger</Link>}/>{notice ? <div className={clsx("mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs", notice.startsWith("Enter") ? "border-[#ef444455] bg-[#ef444410] text-[#ef4444]" : "border-[#00d08455] bg-[#00d08410] text-[#00d084]")}><span>{notice}</span><button type="button" onClick={() => setNotice("")}><IconX size={15}/></button></div> : null}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Pending Deposits" value={String(payments.filter((payment) => payment.type === "Deposit" && payment.status === "Pending").length)} change="$17,500 awaiting review" icon={IconArrowDown} colour="#00d084"/><AdminMetric label="Pending Withdrawals" value={String(payments.filter((payment) => payment.type === "Withdrawal" && payment.status === "Pending").length)} change="$12,000 awaiting approval" icon={IconArrowUp}/><AdminMetric label="Processed Today" value="$248,420" change="184 transactions" icon={IconCircleCheck} colour="#2f80ed"/><AdminMetric label="Flagged Transactions" value="3" change="Compliance review" icon={IconAlertTriangle} colour="#ef4444"/></div><AdminCard className="mt-4" title="Payment Approval Queue"><div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><AdminTabs options={["All", "Pending", "Deposit", "Withdrawal", "Approved", "Rejected"]} value={filter} onChange={setFilter}/><div className="flex gap-2"><button type="button" className="dash-button"><IconRefresh size={15}/>Reconcile</button><button type="button" className="dash-button" onClick={() => downloadCsv("korvesta-payments.csv", [["ID", "Customer", "Type", "Method", "Amount", "Submitted", "Status"], ...payments.map((payment) => [payment.id, payment.customer, payment.type, payment.method, payment.amount, payment.submitted, payment.status])])}><IconDownload size={15}/>Export</button></div></div><AdminTable headers={["Reference", "Customer", "Type", "Method", "Amount", "Submitted", "Evidence", "Status", "Action"]} rows={shown.map((payment) => [<b key="id">{payment.id}</b>, payment.customer, <span key="type" className={payment.type === "Deposit" ? "text-[#00d084]" : "text-[#ffc400]"}>{payment.type}</span>, payment.method, <b key="amount">{money(payment.amount)}</b>, payment.submitted, payment.proof ? <span key="proof" className="text-[#8b5cf6]">Available</span> : <span key="proof" className="text-[var(--dash-muted)]">Network check</span>, <AdminStatus key="status" tone={toneForStatus(payment.status)}>{payment.status}</AdminStatus>, <button key="action" type="button" onClick={() => setSelected(payment)} className="dash-button min-h-8 px-3"><IconEye size={14}/>Review</button>])}/></AdminCard>{selected ? <AdminModal title={`Review ${selected.type.toLowerCase()}`} copy={`${selected.id} · Submitted ${selected.submitted}`} close={() => setSelected(null)} size="lg"><div className="grid gap-4 lg:grid-cols-2"><div><AdminCard title="Transaction summary" className="shadow-none">{[["Customer", selected.customer], ["Type", selected.type], ["Method", selected.method], ["Amount", money(selected.amount)], ["Current status", selected.status]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[var(--dash-line)] py-3 text-xs last:border-0"><span className="text-[var(--dash-muted)]">{label}</span><b>{value}</b></div>)}</AdminCard><ConfirmBox>{selected.type === "Deposit" ? "Approve only after the amount, sender, payment reference and destination account agree with the uploaded evidence or payment-provider verification." : "Withdrawal approval should require sufficient ledger balance, completed KYC, passed risk screening and a verified destination."}</ConfirmBox></div><div><div className="grid aspect-[1.7] place-items-center rounded-xl border border-dashed border-[var(--dash-line)] bg-[var(--dash-card-2)] text-center"><div><IconFileDescription className="mx-auto text-[#8b5cf6]" size={38}/><b className="mt-3 block text-sm">{selected.proof || "Blockchain/payment verification"}</b><p className="mt-1 text-xs text-[var(--dash-muted)]">{selected.proof ? "Payment proof available for inspection" : "Verify the destination and transaction reference"}</p><button type="button" className="dash-button mt-4 min-h-8"><IconEye size={14}/>Inspect evidence</button></div></div><FieldLabel label="Decision note"><textarea className="dash-input min-h-24 py-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required when rejecting; recommended for approvals..."/></FieldLabel></div></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" className="dash-button text-[#ef4444]" onClick={() => decide("Rejected")}><IconX size={16}/>Reject</button><button type="button" className="gold-button" onClick={() => decide("Approved")}><IconCheck size={16}/>Approve {selected.type}</button></div></AdminModal> : null}</>;
}

type PlanModal = { type: "create" | "edit"; plan?: AdminInvestmentPlan } | null;

export function InvestmentsAdminPage() {
  const [plans, setPlans] = useState(initialInvestmentPlans);
  const [modal, setModal] = useState<PlanModal>(null);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [apy, setApy] = useState("8.5");
  const [duration, setDuration] = useState("90 days");
  const [minimum, setMinimum] = useState("500");
  const [maximum, setMaximum] = useState("25000");
  const [risk, setRisk] = useState<AdminInvestmentPlan["risk"]>("Low");
  const [status, setStatus] = useState<AdminInvestmentPlan["status"]>("Draft");

  const openPlan = (next: PlanModal) => {
    setModal(next);
    const plan = next?.plan;
    setName(plan?.name || "");
    setApy(String(plan?.apy || 8.5));
    setDuration(plan?.duration || "90 days");
    setMinimum(String(plan?.minimum || 500));
    setMaximum(String(plan?.maximum || 25000));
    setRisk(plan?.risk || "Low");
    setStatus(plan?.status || "Draft");
  };
  const savePlan = () => {
    if (!modal || name.trim().length < 3 || Number(apy) <= 0 || Number(minimum) <= 0 || Number(maximum) < Number(minimum)) {
      setNotice("Complete every plan field and ensure the maximum exceeds the minimum.");
      return;
    }
    if (modal.type === "edit" && modal.plan) {
      setPlans((current) => current.map((plan) => plan.id === modal.plan?.id ? { ...plan, name, apy: Number(apy), duration, minimum: Number(minimum), maximum: Number(maximum), risk, status } : plan));
      setNotice(`${name} was updated. The change was recorded in the audit log.`);
    } else {
      setPlans((current) => [...current, { id: `PLAN-${String(current.length + 1).padStart(3, "0")}`, name, apy: Number(apy), duration, minimum: Number(minimum), maximum: Number(maximum), investors: 0, capital: 0, risk, status }]);
      setNotice(`${name} was created as a ${status.toLowerCase()} investment plan.`);
    }
    setModal(null);
  };
  return <><AdminHeading title="Investment Management" subtitle="Create investment plans, change product terms and monitor customer allocations." action={<button type="button" className="gold-button" onClick={() => openPlan({ type: "create" })}><IconPlus size={16}/>Create investment plan</button>}/>{notice ? <div className={clsx("mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs", notice.startsWith("Complete") ? "border-[#ef444455] bg-[#ef444410] text-[#ef4444]" : "border-[#00d08455] bg-[#00d08410] text-[#00d084]")}><span>{notice}</span><button type="button" onClick={() => setNotice("")}><IconX size={15}/></button></div> : null}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Investment Capital" value={money(plans.reduce((sum, plan) => sum + plan.capital, 0))} change="Across all active plans" icon={IconBriefcase}/><AdminMetric label="Active Investors" value={plans.reduce((sum, plan) => sum + plan.investors, 0).toLocaleString()} change="+82 this month" icon={IconUsers} colour="#2f80ed"/><AdminMetric label="Returns Distributed" value="$842,620" change="$94,250 this month" icon={IconTrendingUp} colour="#00d084"/><AdminMetric label="Plans at Capacity" value="1" change="Balanced Growth · 92%" icon={IconAlertTriangle} colour="#8b5cf6"/></div><div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_.7fr]"><AdminCard title="Capital Growth"><InteractiveChart data={adminOverviewSeries.map((value) => value * 58000)} symbol="Investment capital" height={300} defaultTimeframe="1Y"/></AdminCard><AdminCard title="Product Distribution">{plans.map((plan) => { const percentage = Math.round(plan.capital / Math.max(1, plans.reduce((sum, item) => sum + item.capital, 0)) * 100); return <div key={plan.id} className="py-3"><div className="flex justify-between text-xs"><span>{plan.name}</span><b>{percentage}%</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--dash-line)]"><div className="h-full rounded-full bg-[#ffc400]" style={{ width: `${percentage}%` }}/></div></div>; })}</AdminCard></div><AdminCard className="mt-4" title="Investment Plans" action={<button type="button" className="dash-button min-h-8" onClick={() => downloadCsv("korvesta-investment-plans.csv", [["ID", "Plan", "APY", "Duration", "Minimum", "Maximum", "Investors", "Capital", "Risk", "Status"], ...plans.map((plan) => [plan.id, plan.name, plan.apy, plan.duration, plan.minimum, plan.maximum, plan.investors, plan.capital, plan.risk, plan.status])])}><IconDownload size={14}/>Export</button>}><AdminTable headers={["Plan", "APY", "Duration", "Limits", "Investors", "Capital", "Risk", "Status", "Actions"]} rows={plans.map((plan) => [<span key="plan"><b className="block">{plan.name}</b><small className="text-[var(--dash-muted)]">{plan.id}</small></span>, <b key="apy" className="text-[#00d084]">{plan.apy}%</b>, plan.duration, <span key="limits">{money(plan.minimum)}<br/><small className="text-[var(--dash-muted)]">to {money(plan.maximum)}</small></span>, plan.investors.toLocaleString(), money(plan.capital), <AdminStatus key="risk" tone={toneForStatus(plan.risk)}>{plan.risk}</AdminStatus>, <AdminStatus key="status" tone={toneForStatus(plan.status)}>{plan.status}</AdminStatus>, <span key="actions" className="flex gap-1"><button type="button" onClick={() => openPlan({ type: "edit", plan })} className="admin-icon-button"><IconEdit size={15}/></button><button type="button" onClick={() => { setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item)); setNotice(`${plan.name} is now ${plan.status === "Active" ? "paused" : "active"}.`); }} className="admin-icon-button"><IconRefresh size={15}/></button></span>])}/></AdminCard>{modal ? <AdminModal title={modal.type === "create" ? "Create investment plan" : "Edit investment plan"} copy="Configure the customer-facing terms and operational status." close={() => setModal(null)} size="lg"><ConfirmBox>Displayed returns should match an authorised investment product. Production publishing must pass compliance review and record the approving administrator.</ConfirmBox><div className="mt-4 grid gap-4 sm:grid-cols-2"><FieldLabel label="Plan name"><input className="dash-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Stable Income"/></FieldLabel><FieldLabel label="Target APY (%)"><input className="dash-input" value={apy} onChange={(event) => setApy(event.target.value)} inputMode="decimal"/></FieldLabel><FieldLabel label="Duration"><select className="dash-input" value={duration} onChange={(event) => setDuration(event.target.value)}><option>Flexible</option><option>30 days</option><option>90 days</option><option>180 days</option><option>365 days</option></select></FieldLabel><FieldLabel label="Risk rating"><select className="dash-input" value={risk} onChange={(event) => setRisk(event.target.value as AdminInvestmentPlan["risk"])}><option>Low</option><option>Moderate</option><option>High</option></select></FieldLabel><FieldLabel label="Minimum investment"><input className="dash-input" value={minimum} onChange={(event) => setMinimum(event.target.value)} inputMode="decimal"/></FieldLabel><FieldLabel label="Maximum investment"><input className="dash-input" value={maximum} onChange={(event) => setMaximum(event.target.value)} inputMode="decimal"/></FieldLabel><FieldLabel label="Plan status"><select className="dash-input" value={status} onChange={(event) => setStatus(event.target.value as AdminInvestmentPlan["status"])}><option>Draft</option><option>Active</option><option>Paused</option></select></FieldLabel><FieldLabel label="Payout schedule"><select className="dash-input"><option>At maturity</option><option>Monthly</option><option>Quarterly</option></select></FieldLabel></div><FieldLabel label="Customer disclosure"><textarea className="dash-input min-h-28 py-3" placeholder="Explain strategy, fees, risk and payout terms..."/></FieldLabel><button type="button" className="gold-button mt-5 w-full" onClick={savePlan}><IconCheck size={16}/>{modal.type === "create" ? "Create investment plan" : "Save plan changes"}</button></AdminModal> : null}</>;
}
