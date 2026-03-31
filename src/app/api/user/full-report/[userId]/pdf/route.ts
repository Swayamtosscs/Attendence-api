import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse } from "@/lib/http";
import { getUserFullReport } from "@/lib/user-full-report";
import { userFullReportQuerySchema } from "@/lib/validators";

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.abs(min % 60);
  return `${h}h ${m}m`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return errorResponse("Unauthorized", { status: 401 });

    const parsed = userFullReportQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const report = await getUserFullReport({
      sessionUser,
      userId: params.userId,
      query: {
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        includeEvents: parsed.includeEvents,
        includeOpenSession: parsed.includeOpenSession
      }
    });
    const r: any = report as any;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 40;
    const pageWidth = 595; // A4 width in points
    const pageHeight = 842; // A4 height in points

    const addPage = () => {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      return { page, y: pageHeight - margin };
    };

    let { page, y } = addPage();

    const drawLine = (text: string, size = 11, lineGap = 4) => {
      const maxWidth = pageWidth - margin * 2;
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const w of words) {
        const candidate = current ? `${current} ${w}` : w;
        const width = font.widthOfTextAtSize(candidate, size);
        if (width > maxWidth && current) {
          lines.push(current);
          current = w;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);

      const height = lines.length * (size + lineGap);
      if (y - height < margin) {
        ({ page, y } = addPage());
      }
      page.setFont(font);
      page.setFontSize(size);
      for (const line of lines) {
        page.drawText(line, { x: margin, y });
        y -= size + lineGap;
      }
    };

    // Title
    drawLine("Attendance Full Report", 18, 8);
    y -= 6;

    // Header info
    drawLine(`Name: ${r.user?.name ?? "-"}`);
    drawLine(`Email: ${r.user?.email ?? "-"}`);
    drawLine(`Department: ${r.user?.department ?? "-"}`);
    drawLine(`Designation: ${r.user?.designation ?? "-"}`);
    drawLine(`Range: ${r.range.startDate} to ${r.range.endDate}`);
    y -= 8;

    // Summary
    drawLine("Summary", 13, 6);
    drawLine(
      `Total Worked: ${r.totals.totalHours} hours (${formatMinutes(
        r.totals.totalMinutes
      )})`
    );
    drawLine(
      `Days - Present: ${r.totals.presentDays}, Half-day: ${r.totals.halfDays}, Absent: ${r.totals.absentDays}, On-leave: ${r.totals.onLeaveDays}`
    );
    drawLine(`Holidays in range: ${r.holidays.count}`);
    drawLine(
      `Leaves - Approved: ${r.leaves.approvedRequests} (${r.leaves.approvedLeaveDaysCount} days), Pending: ${r.leaves.pendingRequests}, Rejected: ${r.leaves.rejectedRequests}`
    );
    y -= 8;

    // Holidays
    drawLine("Holidays", 13, 6);
    if (!r.holidays.list?.length) {
      drawLine("No holidays in selected range.", 10, 4);
    } else {
      for (const h of r.holidays.list as any[]) {
        drawLine(
          `${new Date(h.date).toISOString().slice(0, 10)} - ${h.name} (${h.type})`,
          10,
          4
        );
      }
    }
    y -= 8;

    // Leaves
    drawLine("Leave Requests", 13, 6);
    if (!r.leaves.list?.length) {
      drawLine("No leave requests in selected range.", 10, 4);
    } else {
      for (const l of r.leaves.list as any[]) {
        drawLine(
          `${new Date(l.startDate).toISOString().slice(0, 10)} to ${new Date(
            l.endDate
          ).toISOString().slice(0, 10)} - ${l.type} - ${l.status}`,
          10,
          4
        );
      }
    }
    y -= 8;

    // Daily attendance
    drawLine("Daily Attendance", 13, 6);
    for (const d of r.attendance.days as any[]) {
      drawLine(
        `${d.date} | status: ${d.status ?? "-"} | worked: ${
          d.workDurationHours
        }h (${formatMinutes(d.workDurationMinutes)}) | first in: ${formatDateTime(
          d.firstCheckInAt
        )} | last out: ${formatDateTime(d.lastCheckOutAt)}`,
        9,
        3
      );
      if (parsed.includeEvents !== false && d.sessions?.length) {
        for (const s of d.sessions as any[]) {
          drawLine(
            `  - ${formatDateTime(s.checkInAt)} -> ${formatDateTime(
              s.checkOutAt
            )} (${formatMinutes(s.minutes)})`,
            9,
            3
          );
        }
      }
      y -= 4;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `attendance-report-${params.userId}-${r.range.startDate}-to-${r.range.endDate}.pdf`;

    return new Response(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    if ((error as any)?.message === "Invalid user id") {
      return errorResponse("Invalid user id", { status: 400 });
    }
    if ((error as any)?.statusCode === 403) {
      return errorResponse("Forbidden", { status: 403 });
    }
    if ((error as any)?.statusCode === 404) {
      return errorResponse("User not found", { status: 404 });
    }
    return handleApiError("user/full-report/pdf", error);
  }
}

