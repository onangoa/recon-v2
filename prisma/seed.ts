import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data in order of dependencies
    await prisma.metric.deleteMany({});
    await prisma.visitor.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.site.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.contractor.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});

    console.log('Cleared existing data');

    // Create subscription plans first
    const basicPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        price: 2999,
        maxProjects: 5,
        maxTeamMembers: 3,
        features: 'Up to 5 projects,Basic reporting,Email support',
      },
    });

    const proPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        price: 7999,
        maxProjects: 50,
        maxTeamMembers: 15,
        features: 'Unlimited projects,Advanced reporting,Priority support,Team management',
      },
    });

    const enterprisePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        price: 19999,
        maxProjects: 999,
        maxTeamMembers: 999,
        features: 'Unlimited projects,Custom reporting,24/7 support,Advanced features',
      },
    });

    console.log('Created subscription plans');

    // Create Superadmin user (note: there's no superadmin model in schema, just a user with role)
    const superadminUser = await prisma.user.create({
      data: {
        email: 'admin@constructionhub.ke',
        password: 'hashed_admin_password',
        role: 'superadmin',
        name: 'John Admin',
      },
    });

    console.log('Created superadmin user');

    // Create contractors with users
    const contractors = [];
    const contractorData = [
      {
        name: 'Nairobi Builders Ltd',
        email: 'info@nairobibuilders.ke',
        phone: '+254722111111',
        location: 'Nairobi',
        licenseNo: 'LIC-001-2024',
      },
      {
        name: 'Kisumu Construction Co',
        email: 'hello@kisumucon.ke',
        phone: '+254722222222',
        location: 'Kisumu',
        licenseNo: 'LIC-002-2024',
      },
      {
        name: 'Mombasa Developers',
        email: 'contact@mombasadev.ke',
        phone: '+254722333333',
        location: 'Mombasa',
        licenseNo: 'LIC-003-2024',
      },
    ];

    for (const data of contractorData) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: 'hashed_contractor_password',
          role: 'contractor',
          name: data.name,
        },
      });

      const contractor = await prisma.contractor.create({
        data: {
          userId: user.id,
          companyName: data.name,
          location: data.location,
          phoneNumber: data.phone,
          licenseNo: data.licenseNo,
          subscriptionPlanId: basicPlan.id,
          safetyScore: 85 + Math.random() * 15,
        },
      });

      contractors.push(contractor);
    }

    console.log('Created contractors');

    // Create projects for each contractor
    const projects = [];
    const projectData = [
      {
        name: 'Galaxy Mall Extension',
        location: 'Nairobi CBD',
        budget: 50000000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
      },
      {
        name: 'Westlands Office Complex',
        location: 'Nairobi',
        budget: 75000000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-03-31'),
      },
      {
        name: 'Lakeside Residential',
        location: 'Kisumu',
        budget: 35000000,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
      },
    ];

    for (let i = 0; i < projectData.length; i++) {
      const project = await prisma.project.create({
        data: {
          contractorId: contractors[i % contractors.length].id,
          name: projectData[i].name,
          description: `Professional ${projectData[i].name} development project`,
          location: projectData[i].location,
          budget: projectData[i].budget,
          status: 'active',
          startDate: projectData[i].startDate,
          endDate: projectData[i].endDate,
        },
      });

      projects.push(project);
    }

    console.log('Created projects');

    // Create sites for each project
    for (const project of projects) {
      for (let i = 1; i <= 2; i++) {
        await prisma.site.create({
          data: {
            projectId: project.id,
            name: `${project.name} - Site ${i}`,
            location: `${project.location}, Site ${i}`,
            description: `Site ${i} for ${project.name}`,
          },
        });
      }
    }

    console.log('Created sites');

    // Create tasks for each project
    for (const project of projects) {
      const taskNames = ['Foundation', 'Framing', 'Roofing', 'Interior', 'Finishing'];
      const statuses = ['completed', 'completed', 'in-progress', 'pending', 'pending'];
      const priorities = ['high', 'high', 'medium', 'medium', 'low'];

      for (let i = 0; i < taskNames.length; i++) {
        await prisma.task.create({
          data: {
            projectId: project.id,
            title: taskNames[i],
            description: `${taskNames[i]} phase of ${project.name}`,
            status: statuses[i],
            priority: priorities[i],
            dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log('Created tasks');

    // Create materials for each project
    for (const project of projects) {
      const materials = [
        { name: 'Cement (50kg)', category: 'cement', quantity: 1000, unit: 'bags', unitCost: 800 },
        { name: 'Sand', category: 'sand', quantity: 500, unit: 'cubic meters', unitCost: 3000 },
        { name: 'Steel Rebar', category: 'steel', quantity: 50, unit: 'tons', unitCost: 45000 },
        { name: 'Bricks', category: 'bricks', quantity: 50000, unit: 'pieces', unitCost: 15 },
      ];

      for (const material of materials) {
        const totalCost = material.quantity * material.unitCost;
        await prisma.material.create({
          data: {
            projectId: project.id,
            name: material.name,
            category: material.category,
            quantity: material.quantity,
            unit: material.unit,
            unitCost: material.unitCost,
            totalCost: totalCost,
            supplier: 'Local Supplier',
            status: 'received',
          },
        });
      }
    }

    console.log('Created materials');

    // Create equipment for each project
    for (const project of projects) {
      const equipment = [
        { name: 'Excavator CAT 320', type: 'Heavy Machinery', dailyRate: 25000 },
        { name: 'Concrete Mixer', type: 'Machinery', dailyRate: 5000 },
        { name: 'Scaffolding', type: 'Safety Equipment', dailyRate: 500 },
        { name: 'Power Generator', type: 'Utility', dailyRate: 8000 },
      ];

      for (const equip of equipment) {
        await prisma.equipment.create({
          data: {
            projectId: project.id,
            name: equip.name,
            type: equip.type,
            dailyRate: equip.dailyRate,
            status: 'in-use',
          },
        });
      }
    }

    console.log('Created equipment');

    // Create documents for each project
    for (const project of projects) {
      const documents = [
        { name: 'Project Charter', type: 'contract' },
        { name: 'Site Safety Plan', type: 'report' },
        { name: 'Budget Estimate', type: 'invoice' },
        { name: 'Contract Agreement', type: 'contract' },
      ];

      for (const doc of documents) {
        await prisma.document.create({
          data: {
            projectId: project.id,
            name: doc.name,
            type: doc.type,
            fileUrl: `/documents/${doc.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          },
        });
      }
    }

    console.log('Created documents');

    // Create photos for each project
    for (const project of projects) {
      await prisma.photo.create({
        data: {
          projectId: project.id,
          imageUrl: `/images/project-${project.id}.jpg`,
          caption: `Progress photo for ${project.name}`,
        },
      });
    }

    console.log('Created photos');

    // Create visitors for each project
    for (const project of projects) {
      for (let i = 0; i < 3; i++) {
        const purposes = ['inspection', 'meeting', 'delivery', 'other'];
        await prisma.visitor.create({
          data: {
            projectId: project.id,
            name: `Visitor ${i + 1}`,
            company: `Company ${i + 1}`,
            purpose: purposes[i % purposes.length],
            checkInTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            checkOutTime: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log('Created visitors');

    // Create metrics for each project
    for (const project of projects) {
      const metricTypes = ['safety', 'progress', 'cost', 'quality'];
      for (const type of metricTypes) {
        await prisma.metric.create({
          data: {
            projectId: project.id,
            type: type,
            value: type === 'progress' ? Math.random() * 100 : 85 + Math.random() * 15,
            unit: type === 'cost' ? 'KES' : '%',
          },
        });
      }
    }

    console.log('Created metrics');

    console.log('✓ Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
