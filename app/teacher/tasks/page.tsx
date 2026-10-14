import TeacherTasksClient from "@/components/TeacherTasksClient";

export default function TeacherTasksPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <TeacherTasksClient />
      </div>
    </main>
  );
}
