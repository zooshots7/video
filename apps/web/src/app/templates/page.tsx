import { redirect } from "next/navigation";

export default function TemplatesPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  if (searchParams.project) {
    redirect(`/editor?project=${searchParams.project}`);
  }

  redirect("/editor");
}
