"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type Icon,
  IconBrandApple,
  IconBrandGoogle,
  IconBrandTelegram,
  IconCheck,
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconUser,
} from "@tabler/icons-react";
import { CountrySelect } from "./CountrySelect";

function AuthInput({
  label,
  name,
  type,
  placeholder,
  icon: FieldIcon,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  icon: Icon;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <span className="relative mt-2 block">
        <FieldIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={17}
        />
        <input
          name={name}
          required
          className="field"
          type={type}
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Google", icon: IconBrandGoogle },
        { label: "Apple", icon: IconBrandApple },
        { label: "Telegram", icon: IconBrandTelegram },
      ].map(({ label, icon: Icon }) => (
        <button
          type="button"
          key={label}
          className="ghost-button min-h-[42px] px-2 text-xs"
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
    </div>
  );
}

export function SignInForm() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "customer",
        email: form.get("identity"),
        password: form.get("password"),
      }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setPending(false);
    if (!response?.ok) {
      setError(result.error ?? "Sign-in is temporarily unavailable.");
      return;
    }
    window.location.assign(result.destination ?? "/dashboard");
  };
  return (
    <form
      action="/dashboard"
      method="get"
      onSubmit={submit}
      className="min-w-0 w-full max-w-[520px]"
    >
      <h1 className="text-[clamp(2.25rem,11vw,2.75rem)] font-semibold leading-tight tracking-[-.04em]">
        Welcome back
      </h1>
      <p className="mt-3 text-base text-muted">
        Sign in to access your account
      </p>
      <div
        className="mt-8 flex w-full max-w-64 border-b text-sm"
        style={{ borderColor: "var(--border)" }}
      >
        {(["email", "phone"] as const).map((item) => (
          <button
            type="button"
            onClick={() => setMethod(item)}
            key={item}
            className={`relative flex-1 pb-3 capitalize ${method === item ? "text-[var(--text)]" : "text-muted"}`}
          >
            {item}
            {method === item && (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--amber)]" />
            )}
          </button>
        ))}
      </div>
      <label className="mt-6 block text-xs font-semibold">
        {method === "email" ? "Email address" : "Phone number"}
      </label>
      <div className="relative mt-2">
        <IconMail
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={17}
        />
        <input
          name="identity"
          autoComplete={method === "email" ? "email" : "tel"}
          required
          type={method === "email" ? "email" : "tel"}
          className="field"
          placeholder={
            method === "email" ? "Enter your email" : "Enter your phone number"
          }
        />
      </div>
      <label className="mt-5 block text-xs font-semibold">Password</label>
      <div className="relative mt-2">
        <IconLock
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={17}
        />
        <input
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          type={show ? "text" : "password"}
          className="field pr-12"
          placeholder="Enter your password"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <IconEye size={17} />
        </button>
      </div>
      <div className="my-5 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-[#ffc400]" />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-[var(--amber)]">Forgot password?</Link>
      </div>
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400"
        >
          {error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="gold-button w-full disabled:opacity-60"
        type="submit"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <div className="my-6 flex items-center gap-4 text-[11px] text-muted">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <SocialButtons />
      <p className="mt-10 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="ml-1 font-medium text-[var(--amber)]">
          Create account →
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [registrationError, setRegistrationError] = useState("");
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordScore = [
    password.length >= 10,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const strength = ["Too weak", "Weak", "Fair", "Good", "Strong"][
    passwordScore
  ];
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    setPendingRegistration(true);
    setRegistrationError("");
    if (password !== confirmPassword) {
      setRegistrationError("The passwords do not match.");
      return;
    }
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email,
        password: form.get("password"),
        country: form.get("country"),
      }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setPendingRegistration(false);
    if (!response?.ok) {
      setRegistrationError(
        result.error ?? "Registration is temporarily unavailable.",
      );
      return;
    }
    router.push("/verify");
  };
  return (
    <form onSubmit={submit} className="w-full max-w-[610px]">
      <h1 className="text-4xl font-semibold tracking-[-.04em]">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted">
        Join Korvesta and unlock the power of live market data.
      </p>
      <div className="mt-7 grid gap-4">
        <AuthInput
          label="Full name"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          icon={IconUser}
        />
        <AuthInput
          label="Email address"
          name="email"
          type="email"
          placeholder="Enter your email address"
          icon={IconMail}
        />
        <label className="block text-xs font-semibold">
          Password
          <span className="relative mt-2 block">
            <IconLock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={17}
            />
            <input
              name="password"
              required
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="At least 10 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </span>
          <span className="mt-2 grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((level) => (
              <i
                key={level}
                className={`h-1 rounded-full ${passwordScore >= level ? (passwordScore < 3 ? "bg-[#ef4444]" : passwordScore === 3 ? "bg-[#ffc400]" : "bg-[#00d084]") : "bg-[var(--border)]"}`}
              />
            ))}
          </span>
          <span className="mt-1 flex justify-between text-[10px] font-normal text-muted">
            <span>
              {password
                ? strength
                : "Use uppercase, lowercase, number and symbol"}
            </span>
            <span>{password.length}/10+</span>
          </span>
        </label>
        <label className="block text-xs font-semibold">
          Confirm password
          <span className="relative mt-2 block">
            <IconLock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={17}
            />
            <input
              name="confirmPassword"
              required
              minLength={10}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="field pr-12"
              type={showConfirmation ? "text" : "password"}
              placeholder="Enter the password again"
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
              aria-label={
                showConfirmation ? "Hide confirmation" : "Show confirmation"
              }
            >
              {showConfirmation ? (
                <IconEyeOff size={18} />
              ) : (
                <IconEye size={18} />
              )}
            </button>
          </span>
          {confirmPassword ? (
            <span
              className={`mt-1 block text-[10px] font-normal ${password === confirmPassword ? "text-[#00d084]" : "text-[#ef4444]"}`}
            >
              {password === confirmPassword
                ? "Passwords match"
                : "Passwords do not match"}
            </span>
          ) : null}
        </label>
        <label className="block text-xs font-semibold">
          Country of residence
          <span className="relative mt-2 block">
            <CountrySelect name="country" required />
          </span>
        </label>
      </div>
      <label className="my-5 flex gap-2 text-[11px] text-muted">
        <input required type="checkbox" className="accent-[#ffc400]" />
        <span>
          I agree to Korvesta&apos;s{" "}
          <Link href="/legal/terms" className="text-[var(--amber)]">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-[var(--amber)]">
            Privacy Policy
          </Link>
        </span>
      </label>
      {registrationError ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400"
        >
          {registrationError}
        </p>
      ) : null}
      <button
        disabled={
          pendingRegistration ||
          passwordScore < 4 ||
          password !== confirmPassword
        }
        className="gold-button w-full disabled:opacity-60"
      >
        {pendingRegistration ? "Creating account…" : "Create Account"}
      </button>
      <div className="my-5 flex items-center gap-4 text-[11px] text-muted">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <SocialButtons />
      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-[var(--amber)]">
          Sign in →
        </Link>
      </p>
    </form>
  );
}

export function VerificationForm({ email }: { email: string }) {
  const verificationWindowSeconds = 120;
  const verificationCodeLength = 8;
  const router = useRouter();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(() =>
    Array.from({ length: verificationCodeLength }, () => ""),
  );
  const [error, setError] = useState("");
  const [verificationNotice, setVerificationNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    verificationWindowSeconds,
  );
  const [resending, setResending] = useState(false);
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setInterval(
      () => setSecondsRemaining((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);
  const countdown = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const changeDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < verificationCodeLength - 1)
      refs.current[index + 1]?.focus();
  };
  async function verify() {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: digits.join("") }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setPending(false);
    if (!response?.ok) return setError(result.error ?? "Verification failed.");
    router.replace("/success");
    router.refresh();
  }
  async function resend() {
    if (secondsRemaining > 0 || resending) return;
    setResending(true);
    setError("");
    setVerificationNotice("");
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "resend" }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setResending(false);
    if (!response?.ok)
      return setError(result.error ?? "A new code could not be sent.");
    setDigits(Array.from({ length: verificationCodeLength }, () => ""));
    setSecondsRemaining(verificationWindowSeconds);
    setVerificationNotice("A new verification code was sent.");
  }
  return (
    <div className="w-full max-w-[600px]">
      <Link
        href="/register"
        className="mb-8 inline-flex text-sm text-muted hover:text-[var(--amber)]"
      >
        ← &nbsp;Back
      </Link>
      <h1 className="text-4xl font-semibold tracking-[-.04em]">
        Verify your account
      </h1>
      <p className="mt-3 text-sm text-muted">
        Enter the 8-digit code we sent to
      </p>
      <p className="mt-2 break-all font-semibold">
        {email || "Return to registration and enter your email."}
      </p>
      <div className="mt-8 grid max-w-[600px] grid-cols-4 gap-3 sm:grid-cols-8">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-label={`Verification digit ${i + 1}`}
            className="h-16 min-w-0 rounded-lg border bg-[var(--surface-2)] text-center text-xl font-semibold outline-none focus:border-[var(--amber)]"
            style={{ borderColor: i === 0 ? "var(--amber)" : "var(--border)" }}
            inputMode="numeric"
            value={digit}
            onChange={(e) => changeDigit(i, e.target.value)}
          />
        ))}
      </div>
      <div className="mt-6 flex max-w-[600px] justify-between text-sm">
        <span className="text-muted">
          {secondsRemaining > 0 ? "Resend available in " : "You can resend now"}
          {secondsRemaining > 0 ? (
            <strong className="text-[var(--text)]">{countdown}</strong>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={secondsRemaining > 0 || resending || !email}
          className="text-[var(--amber)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {resending ? "Sending…" : "Resend code ↻"}
        </button>
      </div>
      <div className="surface-soft mt-8 flex max-w-[500px] gap-4 p-5">
        <IconLock size={25} className="shrink-0 text-[var(--amber)]" />
        <p className="text-sm leading-6 text-muted">
          Verifying your device helps keep your account secure. This step
          protects against unauthorised access.
        </p>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-5 max-w-[500px] rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400"
        >
          {error}
        </p>
      ) : null}
      {verificationNotice ? (
        <p
          role="status"
          className="mt-5 max-w-[500px] rounded-lg border border-[var(--border)] p-3 text-xs text-muted"
        >
          {verificationNotice}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || !email}
        onClick={() => void verify()}
        className="gold-button mt-8 w-full max-w-[500px] disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify Account"} <IconCheck size={18} />
      </button>
      <p className="mt-14 text-sm text-muted">
        Need help?{" "}
        <Link href="/support" className="text-[var(--amber)]">
          Contact Support →
        </Link>
      </p>
    </div>
  );
}
