interface ValidationNoticeProps {
  messages: string[];
}

/**
 * Displays validation errors without preventing the rest of the tab chrome from rendering.
 *
 * @param props The component props.
 * @param props.messages The validation messages to display.
 * @returns A warning callout, or null when there are no messages.
 */
export function ValidationNotice({ messages }: ValidationNoticeProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <h3 className="mb-2 font-semibold">Input validation</h3>
      <ul className="list-disc space-y-1 pl-5">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
