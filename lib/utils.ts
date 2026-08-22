import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function changeClass(value: number) {
  return value >= 0 ? "text-[#28c76f]" : "text-[#ff4d43]";
}

export function formatChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
