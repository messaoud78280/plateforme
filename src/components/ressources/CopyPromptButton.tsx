"use client";

import { useState } from "react";

interface CopyPromptButtonProps {
	text: string;
	className?: string;
}

export function CopyPromptButton({ text, className }: CopyPromptButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={
				className ??
				"rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
			}
		>
			{copied ? "Copié !" : "Copier le prompt"}
		</button>
	);
}
