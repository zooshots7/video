import { redirect } from "next/navigation";

export default function ReviewPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  if (searchParams.project) {
    redirect(`/editor?project=${searchParams.project}`);
  }

  redirect("/editor");
}
