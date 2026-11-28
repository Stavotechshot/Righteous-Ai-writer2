import { useState } from 'react';

export function AssistedEmailDraft({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(text);
  const [subject, setSubject] = useState('');
  const [approved, setApproved] = useState(false);

  if (!open) return (
    <button type="button" className="mx-4 rounded-xl border px-4 py-2 text-sm sm:mx-6"
      onClick={() => { setBody(text); setOpen(true); }}>Prepare email draft</button>
  );

  return (
    <form aria-label="Review AI-assisted email"
      className="mx-4 space-y-3 rounded-xl border p-4 text-sm sm:mx-6"
      onSubmit={event => {
        event.preventDefault();
        if (!approved || !body.trim()) return;
        const query = new URLSearchParams({ subject, body: body.trim() + '\r\n\r\nDrafted with AI assistance.' });
        window.location.href = 'mailto:?' + query.toString().replaceAll('+', '%20');
        setApproved(false);
      }}>
      <p>Review the draft, then choose the recipient and send from your mail app. The draft includes an AI assistance disclosure.</p>
      <label className="block">Subject
        <input className="block w-full rounded border bg-transparent p-2" value={subject} onChange={event => {
          setSubject(event.target.value);
          setApproved(false);
        }} />
      </label>
      <label className="block">Message
        <textarea className="block w-full rounded border bg-transparent p-2" rows={5} required value={body}
          onChange={event => { setBody(event.target.value); setApproved(false); }} />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={approved} onChange={event => setApproved(event.target.checked)} />
        I reviewed and approve this draft
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={!approved || !body.trim()}
          className="rounded border px-3 py-2 disabled:opacity-50">Open in mail app</button>
        <button type="button" className="rounded border px-3 py-2"
          onClick={() => { setApproved(false); setSubject(''); setOpen(false); }}>Cancel</button>
      </div>
    </form>
  );
}
