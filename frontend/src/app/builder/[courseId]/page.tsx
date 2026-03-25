import { BuilderLayout } from "@/components/builder/BuilderLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Builder - CipherLearn",
  description: "Design premium landing pages with the drag-and-drop course builder",
};

export default async function BuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <BuilderLayout courseId={courseId} />;
}
