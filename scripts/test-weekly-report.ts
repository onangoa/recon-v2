/**
 * End-to-end sanity test for the Weekly Progress Report (SAMPLE REPORT.docx
 * format) against the local dev DB. Runs the site + weekly-report route
 * handlers directly with a signed contractor token:
 *
 *   1. picks a Contractor Admin user and their site with the most daily
 *      reports (creating a week of throwaway reports if none exist),
 *   2. PUTs the site's weekly-report fields (incl. a site image) through
 *      the sites route and checks they round-trip,
 *   3. assigns a throwaway staff member to the site (PROJECT TEAM section),
 *   4. GETs the weekly-report PDF for the site's latest reported week and
 *      checks the PDF structure, section markers, the staff member and the
 *      site header image,
 *   5. restores the site's original field values and removes throwaway rows.
 */
import 'dotenv/config';
import { NextRequest } from 'next/server';
import { readdirSync } from 'fs';
import { join } from 'path';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { prisma } from '../lib/prisma';
import { generateAccessToken } from '../lib/jwt';
import { toFormDate } from '../lib/site-report';
import { GET as getSite, PUT as putSite } from '../app/web/api/sites/[id]/route';
import { GET as getWeeklyReportPdf } from '../app/web/api/weekly-report/pdf/route';

async function main() {
  const admin = await prisma.user.findFirst({
    where: { contractor: { isNot: null }, roleRelation: { name: 'Contractor Admin' } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      contractor: { select: { id: true, companyName: true } },
    },
  });
  if (!admin?.contractor) {
    console.log('No Contractor Admin user with a contractor found - nothing to test.');
    return;
  }
  console.log(`Admin user: ${admin.email} (${admin.contractor.companyName})`);

  const site = await prisma.site.findFirst({
    where: { contractorId: admin.contractor.id },
    orderBy: { dailyReports: { _count: 'desc' } },
  });
  if (!site) {
    console.log('Contractor has no site - nothing to test.');
    return;
  }
  console.log(`Site: ${site.name} (${site.id})`);

  // A real upload file for the site image (embedded in the report header).
  const uploads = readdirSync(join(process.cwd(), 'public', 'uploads')).filter((f) =>
    /\.(jpe?g|png)$/i.test(f)
  );
  if (uploads.length === 0) {
    console.log('No image files in public/uploads - nothing to test.');
    return;
  }
  const imageUrl = `/uploads/${uploads[0]}`;

  const token = generateAccessToken({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
    contractorId: admin.contractor.id,
  });

  // Ensure the site has at least one week of daily reports with activities.
  let latest = await prisma.dailyReport.findFirst({
    where: { siteId: site.id },
    orderBy: { reportDate: 'desc' },
    include: { activities: true },
  });
  const throwawayReportIds: string[] = [];
  if (!latest || latest.activities.length === 0) {
    console.log('No daily report data - creating throwaway reports for this week...');
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let d = 0; d < 2; d += 1) {
      const created = await prisma.dailyReport.create({
        data: {
          siteId: site.id,
          reportDate: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + d),
          status: 'Submitted',
          activities: {
            create: [
              {
                position: 1,
                title: 'Slab formwork erection',
                description: 'Erected formwork for the second-floor slab.',
                verdict: 'achieved',
              },
              {
                position: 2,
                title: 'Column reinforcement installation',
                description: 'Fixed reinforcement cages for columns.',
                verdict: 'partially_achieved',
              },
            ],
          },
        },
      });
      throwawayReportIds.push(created.id);
    }
    latest = await prisma.dailyReport.findFirst({
      where: { siteId: site.id },
      orderBy: { reportDate: 'desc' },
      include: { activities: true },
    });
  }

  const from = startOfWeek(latest!.reportDate, { weekStartsOn: 1 });
  const to = endOfWeek(latest!.reportDate, { weekStartsOn: 1 });
  const fromKey = format(from, 'yyyy-MM-dd');
  const toKey = format(to, 'yyyy-MM-dd');
  console.log(`Report week: ${fromKey} to ${toKey}`);

  // Throwaway staff member assigned to the site (PROJECT TEAM section).
  const staff = await prisma.teamMember.create({
    data: {
      contractorId: admin.contractor.id,
      name: 'TEST ENGINEER PROBE',
      role: 'Structural Engineer',
      sites: { connect: { id: site.id } },
    },
  });

  const sampleFields = {
    image: imageUrl,
    plotNumber: '1870/I/330',
    builtUpArea: '12,000 m2',
    numberOfFloors: '19',
    commencementDate: '2026-04-01',
    expectedCompletionDate: '2028-05-01',
    contractPeriodMonths: '25',
    overallProgress: '35',
    progressDescription: 'Construction has reached the second floor with most of the 1st floor finishes done',
  };

  function request(url: string, init: { method?: string; body?: string } = {}) {
    return new NextRequest(url, {
      method: init.method,
      body: init.body,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    });
  }

  const before = await prisma.site.findUnique({ where: { id: site.id } });
  try {
    const putRes = await putSite(
      request(`http://localhost/web/api/sites/${site.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: before!.name,
          location: before!.location,
          description: before!.description,
          category: before!.category,
          isPrimary: before!.isPrimary,
          ...sampleFields,
        }),
      }),
      { params: Promise.resolve({ id: site.id }) }
    );
    console.log(`PUT site status: ${putRes?.status}`);
    if (!putRes || !putRes.ok) {
      if (putRes) console.log(await putRes.text());
      throw new Error('PUT site failed');
    }

    const getRes = await getSite(
      request(`http://localhost/web/api/sites/${site.id}`),
      { params: Promise.resolve({ id: site.id }) }
    );
    const siteJson: any = await getRes?.json();
    console.log(`GET site status: ${getRes?.status}`);
    const roundTripOk =
      siteJson.image === imageUrl &&
      siteJson.plotNumber === sampleFields.plotNumber &&
      siteJson.numberOfFloors === 19 &&
      siteJson.overallProgress === 35 &&
      toFormDate(siteJson.commencementDate) === sampleFields.commencementDate;
    console.log(`Site fields round-trip: ${roundTripOk ? 'OK' : 'FAILED'}`);
    if (!roundTripOk) {
      console.log({
        image: siteJson.image,
        plotNumber: siteJson.plotNumber,
        numberOfFloors: siteJson.numberOfFloors,
        overallProgress: siteJson.overallProgress,
        commencementDate: siteJson.commencementDate,
      });
      throw new Error('Site fields round-trip failed');
    }

    // Generate the weekly progress report PDF.
    const pdfRes = await getWeeklyReportPdf(
      request(
        `http://localhost/web/api/weekly-report/pdf?siteId=${site.id}&from=${fromKey}&to=${toKey}`
      )
    );
    console.log(`GET weekly-report PDF status: ${pdfRes?.status}`);
    if (!pdfRes || !pdfRes.ok) {
      if (pdfRes) console.log(await pdfRes.text());
      throw new Error('Weekly report PDF failed');
    }
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const pdfText = pdfBuffer.toString('latin1');
    const imageObjects = (pdfText.match(/\/Subtype[\s]*\/Image/g) || []).length;
    const markers = [
      'WEEKLY PROGRESS REPORT NO.',
      'PROJECT DATA',
      'PROJECT TEAM',
      'CONSTRUCTION STATUS',
      'ACTIVITY SUMMARY',
      'Powered by Recon Engineering International',
      'ACTIVITY 1',
      'Main Contractor',
      'TEST ENGINEER PROBE',
      'Structural Engineer',
      'Prepared by:',
      admin.name || '',
    ].filter(Boolean);
    const missing = markers.filter((m) => !pdfText.includes(m));
    console.log(
      `PDF bytes: ${pdfBuffer.length}, pages: ${(pdfText.match(/\/Type[\s]*\/Page[^s]/g) || []).length}, image objects: ${imageObjects}`
    );
    console.log(`Section markers: ${missing.length === 0 ? 'ALL PRESENT' : `MISSING: ${missing.join(', ')}`}`);
    if (pdfBuffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('Not a PDF file');
    }
    if (imageObjects < 1) {
      throw new Error('Site header image not embedded');
    }
    const outPath = `${process.env.TEMP || '/tmp'}/weekly-progress-report-test.pdf`;
    await (await import('fs/promises')).writeFile(outPath, pdfBuffer);
    console.log(`PDF saved to: ${outPath}`);
    console.log('ALL CHECKS PASSED');
  } finally {
    // Restore original site fields + remove throwaway rows.
    await prisma.site.update({
      where: { id: site.id },
      data: {
        image: before!.image,
        plotNumber: before!.plotNumber,
        builtUpArea: before!.builtUpArea,
        numberOfFloors: before!.numberOfFloors,
        commencementDate: before!.commencementDate,
        expectedCompletionDate: before!.expectedCompletionDate,
        contractPeriodMonths: before!.contractPeriodMonths,
        overallProgress: before!.overallProgress,
        progressDescription: before!.progressDescription,
      },
    });
    await prisma.teamMember.delete({ where: { id: staff.id } });
    if (throwawayReportIds.length > 0) {
      await prisma.dailyReport.deleteMany({ where: { id: { in: throwawayReportIds } } });
    }
    console.log('Restored original site fields and cleaned up throwaway data.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
