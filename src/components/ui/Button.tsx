import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "intel";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-cc-primary",
  secondary: "btn-cc-secondary",
  ghost: "btn-cc-ghost",
  danger: "btn-cc-danger",
  intel: "btn-cc-intel",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "!px-2.5 !py-1 !text-[11px]",
  md: "",
  lg: "!px-4 !py-2.5 !text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={cn(variantClass[variant], sizeClass[size], "cc-focus", className)}
      {...props}
    />
  );
}
