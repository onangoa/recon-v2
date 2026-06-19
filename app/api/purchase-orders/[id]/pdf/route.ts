import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'purchase_orders:read');
    if (!permCheck.authorized) return permCheck.error;

    const { id } = await params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
        site: true,
      },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const doc = new jsPDF() as any;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', 14, 22);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Order: ${po.orderNumber}`, 14, 30);
    doc.text(`Date: ${new Date(po.orderDate).toLocaleDateString()}`, 14, 36);
    if (po.expectedDeliveryDate) {
      doc.text(`Expected Delivery: ${new Date(po.expectedDeliveryDate).toLocaleDateString()}`, 14, 42);
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Supplier', 14, 56);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(po.supplier.name, 14, 62);
    if (po.supplier.email) doc.text(po.supplier.email, 14, 68);
    if (po.supplier.phone) doc.text(po.supplier.phone, 14, 74);

    if (po.site) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Site', 110, 56);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(po.site.name, 110, 62);
      doc.text(po.site.location, 110, 68);
    }

    const statusColors: Record<string, [number, number, number]> = {
      delivered: [34, 197, 94],
      pending: [245, 158, 11],
      processing: [59, 130, 246],
      cancelled: [239, 68, 68],
    };
    const color = statusColors[po.status] || [156, 163, 175];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    const statusText = `Status: ${po.status.toUpperCase()}`;
    doc.text(statusText, 110, 42);

    const tableData = po.items.map((item, i) => [
      (i + 1).toString(),
      item.description,
      item.quantity.toString(),
      `KES ${item.unitPrice.toLocaleString()}`,
      `KES ${item.totalPrice.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 82,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 12 },
        2: { cellWidth: 18, halign: 'center' as const },
        3: { cellWidth: 35, halign: 'right' as const },
        4: { cellWidth: 40, halign: 'right' as const },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: KES ${po.subtotal.toLocaleString()}`, 150, finalY);
    doc.text(`Tax: KES ${po.tax.toLocaleString()}`, 150, finalY + 6);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: KES ${po.total.toLocaleString()}`, 150, finalY + 14);

    if (po.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, finalY + 26);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(po.notes, 170);
      doc.text(lines, 14, finalY + 32);
    }

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PO-${po.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}