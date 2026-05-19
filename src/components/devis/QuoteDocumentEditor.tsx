"use client";

import { QuoteLineEditorErp, type QuoteLineEditorErpProps } from "@/components/devis/QuoteLineEditorErp";

export type QuoteDocumentEditorProps = QuoteLineEditorErpProps;

export function QuoteDocumentEditor(props: QuoteDocumentEditorProps) {
  return <QuoteLineEditorErp {...props} />;
}
