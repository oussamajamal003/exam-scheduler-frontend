import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { BookOpen } from 'lucide-react';
import { PageSpinner } from '@/components/shared/PageSpinner';

export const CoursesPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label="Loading courses" />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-md shadow-zinc-200/40">
        <CardHeader className="grid gap-4 px-4 py-5 sm:px-6 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <BookOpen className="size-5" />
            Courses Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <Input placeholder="Search by course code or title" className="h-10 rounded-xl border-zinc-200 text-sm" />
          <Button className="h-10 rounded-xl whitespace-nowrap bg-zinc-950 px-6 text-white hover:bg-zinc-900">Add Course</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-md shadow-zinc-200/40 overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6 sm:py-6">
          <CardTitle className="text-lg sm:text-xl">Course Catalog</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200/60 hover:bg-transparent">
                  <TableHead className="px-4 py-3 sm:px-6">Code</TableHead>
                  <TableHead className="px-4 py-3 sm:px-6">Title</TableHead>
                  <TableHead className="px-4 py-3 sm:px-6">Program</TableHead>
                  <TableHead className="px-4 py-3 sm:px-6">Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-zinc-200/60 hover:bg-zinc-50/50">
                  <TableCell className="px-4 py-3 sm:px-6 font-medium text-zinc-950">CS401</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">Advanced Algorithms</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">Computer Science</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">Fall 2026</TableCell>
                </TableRow>
                <TableRow className="border-zinc-200/60 hover:bg-zinc-50/50">
                  <TableCell className="px-4 py-3 sm:px-6 font-medium text-zinc-950">SE320</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">Software Architecture</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">Software Engineering</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">Fall 2026</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
