import { notFound } from "next/navigation";

import EditorsManager from "@/components/admin/EditorsManager";
import { isEditor, loadEditors } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

/**
 * Who may use the administration.
 *
 * Read uncached, like the allowlist itself — this page is where somebody comes
 * to check whether a change took effect, so it has to show the current state
 * rather than a recent one.
 */
export default async function AdminEditorsPage() {
  const editor = await getEditor();
  if (!(await isEditor(editor?.email))) notFound();

  return (
    <EditorsManager
      editors={await loadEditors()}
      currentEmail={(editor?.email ?? "").toLowerCase()}
    />
  );
}
