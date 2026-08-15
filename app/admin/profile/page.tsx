import { notFound } from "next/navigation";

import ProfileForm from "@/components/admin/ProfileForm";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

/** The signed-in editor's own account. Today that means the password. */
export default async function AdminProfilePage() {
  const editor = await getEditor();
  if (!(await isEditor(editor?.email)) || !editor?.email) notFound();

  return <ProfileForm email={editor.email} />;
}
