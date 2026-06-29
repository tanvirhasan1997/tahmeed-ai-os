"use client";
export default function CommandCenter() {
  return (
    <div className="flex flex-col h-screen items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">Tahmeed AI OS</h1>
      <p className="text-muted-foreground mb-8">One Command. Your Entire AI Team.</p>
      <div className="w-full max-w-2xl">
        <textarea placeholder="Type a command... (e.g., 'Fix the login bug', 'Write a blog post about AI')" className="w-full px-4 py-3 bg-input border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} />
        <button className="mt-3 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">Send</button>
      </div>
    </div>
  );
}
