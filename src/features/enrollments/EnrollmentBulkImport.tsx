import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { cn } from "../../lib/utils";
import { useVirtualRows } from "../../hooks/common/useVirtualRows";
import type { BulkEnrollmentRow, CreateEnrollmentDto, Enrollment } from "../../schemas/enrollment";
import type { Student } from "../../schemas/student";
import type { CourseOffering } from "../../schemas/courseOffering";

interface EnrollmentBulkImportProps {
  students: Student[];
  offerings: CourseOffering[];
  existingEnrollments: Enrollment[];
  isImporting?: boolean;
  importErrorMessage?: string;
  onImport: (rows: CreateEnrollmentDto[]) => Promise<void> | void;
  onClose: () => void;
}

// ===== CSV parser (handles quoted fields, commas, CRLF) =====
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (insideQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          insideQuotes = false;
        }
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      insideQuotes = true;
    } else if (ch === ",") {
      current.push(value);
      value = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      current.push(value);
      rows.push(current);
      current = [];
      value = "";
    } else {
      value += ch;
    }
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
    rows.push(current);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
};

const normalize = (s?: string) => (s ?? "").trim().toLowerCase();

export function EnrollmentBulkImport({
  students,
  offerings,
  existingEnrollments,
  isImporting,
  importErrorMessage,
  onImport,
  onClose,
}: EnrollmentBulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkEnrollmentRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setParseError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length === 0) {
        setParseError("CSV file is empty.");
        setParsedRows([]);
        return;
      }

      const header = rows[0].map((h) => normalize(h));
      const idx = {
        studentEmail: header.indexOf("studentemail"),
        courseOfferingId: header.indexOf("courseofferingid"),
        courseCode: header.indexOf("coursecode"),
        semester: header.indexOf("semester"),
      };

      if (idx.studentEmail === -1) {
        setParseError(
          'CSV must include "studentEmail", "courseCode", and "semester" columns.'
        );
        setParsedRows([]);
        return;
      }

      if (idx.courseOfferingId === -1 && (idx.courseCode === -1 || idx.semester === -1)) {
        setParseError(
          'Provide both "courseCode" and "semester" columns so offerings can be matched by relational data.'
        );
        setParsedRows([]);
        return;
      }

      const studentByEmail = new Map(
        students.map((s) => [normalize(s.email), s])
      );
      const offeringById = new Map(offerings.map((o) => [o.id, o]));
      const offeringByCodeSem = new Map<string, CourseOffering>();
      offerings.forEach((o) => {
        const k = `${normalize(o.course?.code)}::${normalize(o.semester?.name)}`;
        offeringByCodeSem.set(k, o);
      });

      const existingPairs = new Set(
        existingEnrollments
          .filter((e) => e.student?.id && e.courseOffering?.id)
          .map((e) => `${e.student!.id}::${e.courseOffering!.id}`)
      );

      const seenPairs = new Set<string>();

      const result: BulkEnrollmentRow[] = rows.slice(1).map((cols, i) => {
        const errors: string[] = [];
        const studentEmail = (cols[idx.studentEmail] ?? "").trim();
        const offeringId =
          idx.courseOfferingId >= 0 ? (cols[idx.courseOfferingId] ?? "").trim() : "";
        const courseCode =
          idx.courseCode >= 0 ? (cols[idx.courseCode] ?? "").trim() : "";
        const semester =
          idx.semester >= 0 ? (cols[idx.semester] ?? "").trim() : "";

        if (!studentEmail) errors.push("studentEmail is required");

        const student = studentByEmail.get(normalize(studentEmail));
        if (studentEmail && !student) errors.push(`Student "${studentEmail}" not found`);

        let offering: CourseOffering | undefined;
        if (courseCode && semester) {
          offering = offeringByCodeSem.get(
            `${normalize(courseCode)}::${normalize(semester)}`
          );
          if (!offering)
            errors.push(`Offering for ${courseCode} (${semester}) not found`);
        } else if (offeringId) {
          offering = offeringById.get(offeringId);
          if (!offering) errors.push("Course offering reference was not found");
        } else {
          errors.push("Provide courseCode and semester");
        }

        if (student && offering) {
          const pair = `${student.id}::${offering.id}`;
          if (existingPairs.has(pair)) {
            errors.push("Student is already enrolled in this offering");
          }
          if (seenPairs.has(pair)) {
            errors.push("Duplicate row in this CSV");
          }
          seenPairs.add(pair);
        }

        return {
          rowNumber: i + 2, // +1 for 1-based, +1 for header row
          studentEmail,
          courseOfferingId: offeringId || undefined,
          courseCode: courseCode || undefined,
          semester: semester || undefined,
          resolvedStudentId: student?.id,
          resolvedOfferingId: offering?.id,
          resolvedStudentName: student
            ? `${student.firstName} ${student.lastName}`.trim()
            : undefined,
          resolvedCourseTitle: offering?.course?.title ?? offering?.course?.name,
          status: errors.length === 0 ? "valid" : "invalid",
          errors,
        };
      });

      setParsedRows(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV";
      setParseError(message);
      setParsedRows([]);
    }
  };

  const validRows = useMemo(
    () => parsedRows.filter((r) => r.status === "valid"),
    [parsedRows]
  );
  const invalidRows = useMemo(
    () => parsedRows.filter((r) => r.status === "invalid"),
    [parsedRows]
  );
  const {
    scrollRef,
    onScroll,
    virtualRows,
    topPadding,
    bottomPadding,
    isVirtualized,
    containerClassName,
  } = useVirtualRows(parsedRows, { estimateRowHeight: 72, threshold: 80 });

  const handleConfirm = async () => {
    if (validRows.length === 0) return;
    const payload: CreateEnrollmentDto[] = validRows.map((r) => ({
      studentId: r.resolvedStudentId!,
      courseOfferingId: r.resolvedOfferingId!,
      status: "ACTIVE",
    }));
    await onImport(payload);
  };

  const reset = () => {
    setParsedRows([]);
    setFileName(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="rounded-none border border-zinc-200/80 bg-zinc-50/60 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-zinc-700" />
          <div className="space-y-2 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-950">CSV format</p>
            <p>
              Required column: <code className="rounded-none bg-white px-1 py-0.5 text-xs font-semibold">studentEmail</code>
            </p>
            <p>
              Plus <code className="rounded-none bg-white px-1 py-0.5 text-xs font-semibold">courseCode</code>{" "}
              and{" "}
              <code className="rounded-none bg-white px-1 py-0.5 text-xs font-semibold">semester</code>
            </p>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          title="Choose enrollment CSV file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="inline-flex h-10 items-center gap-2 rounded-none border-zinc-200 font-semibold"
        >
          <Upload className="size-4" />
          {fileName ? "Choose another file" : "Choose CSV file"}
        </Button>
        {fileName && (
          <span className="inline-flex items-center gap-2 rounded-none border border-zinc-200/80 bg-white px-3 py-2 text-xs font-medium text-zinc-700">
            <FileSpreadsheet className="size-3.5" />
            {fileName}
            <button
              type="button"
              onClick={reset}
              aria-label="Clear selected CSV file"
              title="Clear selected CSV file"
              className="ml-1 text-zinc-400 hover:text-zinc-700"
            >
              <X className="size-3.5" />
            </button>
          </span>
        )}
      </div>

      {parseError && (
        <div className="flex items-start gap-2 rounded-none border border-destructive/20 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">{parseError}</p>
        </div>
      )}

      {importErrorMessage && (
        <div className="flex items-start gap-2 rounded-none border border-destructive/20 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">{importErrorMessage}</p>
        </div>
      )}

      {/* Results */}
      {parsedRows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-none border border-zinc-200/80 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Total rows</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{parsedRows.length}</p>
            </div>
            <div className="rounded-none border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Valid
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{validRows.length}</p>
            </div>
            <div className="rounded-none border border-red-200 bg-red-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700">
                <AlertTriangle className="size-3.5" />
                Invalid
              </p>
              <p className="mt-1 text-2xl font-bold text-red-800">{invalidRows.length}</p>
            </div>
          </div>

          <div ref={scrollRef} onScroll={onScroll} className={cn("overflow-x-auto rounded-none border border-zinc-200/80", containerClassName || "max-h-85 overflow-y-auto")}>
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-b border-zinc-200/60 bg-zinc-50/40">
                  <TableHead className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Row
                  </TableHead>
                  <TableHead className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Student
                  </TableHead>
                  <TableHead className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Course
                  </TableHead>
                  <TableHead className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isVirtualized && topPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={4} style={{ height: topPadding, padding: 0 }} />
                  </TableRow>
                )}
                {virtualRows.map(({ item: row }) => (
                  <TableRow
                    key={row.rowNumber}
                    className={cn(
                      "border-b border-zinc-200/40",
                      row.status === "invalid" && "bg-red-50/40"
                    )}
                  >
                    <TableCell className="px-3 py-2 text-xs font-mono text-zinc-500">
                      {row.rowNumber}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      <div className="font-semibold text-zinc-950">
                        {row.resolvedStudentName ?? row.studentEmail}
                      </div>
                      {row.resolvedStudentName && (
                        <p className="text-xs text-zinc-500">{row.studentEmail}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      <div className="font-semibold text-zinc-950">
                        {row.resolvedCourseTitle ??
                          row.courseCode ??
                          "Unknown offering"}
                      </div>
                      {row.semester && (
                        <p className="text-xs text-zinc-500">{row.semester}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {row.status === "valid" ? (
                        <span className="inline-flex items-center gap-1 rounded-none bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          Valid
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-none bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                            <AlertTriangle className="size-3" />
                            Invalid
                          </span>
                          <ul className="ml-1 list-disc pl-3 text-xs text-red-700">
                            {row.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {isVirtualized && bottomPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={4} style={{ height: bottomPadding, padding: 0 }} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isImporting}
          className="h-10 rounded-none"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isImporting || validRows.length === 0}
          className="h-10 rounded-none bg-zinc-950 font-semibold text-white hover:bg-zinc-900"
        >
          {isImporting
            ? "Importing…"
            : validRows.length > 0
            ? `Import ${validRows.length} valid row${validRows.length === 1 ? "" : "s"}`
            : "Import"}
        </Button>
      </div>
    </div>
  );
}
