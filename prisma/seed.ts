import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data in order of dependencies
    await prisma.salarySlipDetail.deleteMany({});
    await prisma.salarySlip.deleteMany({});
    await prisma.payrollPeriod.deleteMany({});
    await prisma.salaryComponent.deleteMany({});
    await prisma.worker.deleteMany({});
    await prisma.designation.deleteMany({});
    await prisma.metric.deleteMany({});
    await prisma.visitor.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.license.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.inventoryCategory.deleteMany({});
    await prisma.site.deleteMany({});
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
        maxSites: 5,
        maxTeamMembers: 3,
        features: JSON.stringify(['Up to 5 sites', 'Basic reporting', 'Email support']),
      },
    });

    const proPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        price: 7999,
        maxSites: 50,
        maxTeamMembers: 15,
        features: JSON.stringify(['Unlimited sites', 'Advanced reporting', 'Priority support', 'Team management']),
      },
    });

    const enterprisePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        price: 19999,
        maxSites: 999,
        maxTeamMembers: 999,
        features: JSON.stringify(['Unlimited sites', 'Custom reporting', '24/7 support', 'Advanced features']),
      },
    });

    console.log('Created subscription plans');

    // Create Superadmin user (note: there's no superadmin model in schema, just a user with role)
    const superadminUser = await prisma.user.create({
      data: {
        email: 'admin@constructionhub.ke',
        password: '12345678',
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
          password: '12345678',
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

    // Create Designations for each contractor
    const designations = [];
    for (const contractor of contractors) {
      const designData = [
        { title: 'Site Manager', description: 'Oversees entire site operations', minSalary: 150000, maxSalary: 250000 },
        { title: 'Project Engineer', description: 'Handles engineering aspects', minSalary: 120000, maxSalary: 180000 },
        { title: 'Foreman', description: 'Leads worker teams', minSalary: 60000, maxSalary: 90000 },
        { title: 'Mason', description: 'Stone and brick work', minSalary: 45000, maxSalary: 65000 },
        { title: 'Electrician', description: 'Electrical installations', minSalary: 50000, maxSalary: 75000 },
        { title: 'Laborer', description: 'General site work', minSalary: 25000, maxSalary: 35000 },
      ];

      for (const data of designData) {
        const designation = await prisma.designation.create({
          data: {
            contractorId: contractor.id,
            ...data,
          },
        });
        designations.push(designation);
      }
    }
    console.log('Created designations');

    // Create Workers for each contractor
    const workers = [];
    let workerCounter = 1;
    for (const contractor of contractors) {
      const contractorDesignations = designations.filter(d => d.contractorId === contractor.id);
      const workerData = [
        { name: `Worker ${workerCounter}`, email: `worker${workerCounter}@example.com`, phone: `+254700000${workerCounter.toString().padStart(3, '0')}`, nationalId: `ID-${workerCounter.toString().padStart(6, '0')}`, designationId: contractorDesignations[0].id },
        { name: `Worker ${workerCounter + 1}`, email: `worker${workerCounter + 1}@example.com`, phone: `+254700000${(workerCounter + 1).toString().padStart(3, '0')}`, nationalId: `ID-${(workerCounter + 1).toString().padStart(6, '0')}`, designationId: contractorDesignations[1].id },
        { name: `Worker ${workerCounter + 2}`, email: `worker${workerCounter + 2}@example.com`, phone: `+254700000${(workerCounter + 2).toString().padStart(3, '0')}`, nationalId: `ID-${(workerCounter + 2).toString().padStart(6, '0')}`, designationId: contractorDesignations[2].id },
        { name: `Worker ${workerCounter + 3}`, email: `worker${workerCounter + 3}@example.com`, phone: `+254700000${(workerCounter + 3).toString().padStart(3, '0')}`, nationalId: `ID-${(workerCounter + 3).toString().padStart(6, '0')}`, designationId: contractorDesignations[3].id },
        { name: `Worker ${workerCounter + 4}`, email: `worker${workerCounter + 4}@example.com`, phone: `+254700000${(workerCounter + 4).toString().padStart(3, '0')}`, nationalId: `ID-${(workerCounter + 4).toString().padStart(6, '0')}`, designationId: contractorDesignations[4].id },
        { name: `Worker ${workerCounter + 5}`, email: `worker${workerCounter + 5}@example.com`, phone: `+254700000${(workerCounter + 5).toString().padStart(3, '0')}`, nationalId: `ID-${(workerCounter + 5).toString().padStart(6, '0')}`, designationId: contractorDesignations[5].id },
      ];

      for (const data of workerData) {
        const worker = await prisma.worker.create({
          data: {
            contractorId: contractor.id,
            ...data,
            status: 'Active',
            joinedAt: new Date(),
          },
        });
        workers.push(worker);
      }
      workerCounter += 6;
    }
    console.log('Created workers');

    // Create Salary Components for each contractor
    for (const contractor of contractors) {
      const componentData = [
        { name: 'House Allowance', type: 'earning', calculationType: 'percentage', percentage: 15, sortOrder: 1 },
        { name: 'Transport Allowance', type: 'earning', calculationType: 'fixed', amount: 5000, sortOrder: 2 },
        { name: 'NHIF', type: 'deduction', deductionType: 'pre_tax', calculationType: 'fixed', amount: 1700, isStatutory: true, sortOrder: 3 },
        { name: 'NSSF', type: 'deduction', deductionType: 'pre_tax', calculationType: 'fixed', amount: 1080, isStatutory: true, sortOrder: 4 },
        { name: 'Advance Payment', type: 'deduction', deductionType: 'post_tax', calculationType: 'fixed', amount: 0, sortOrder: 5 },
      ];

      for (const data of componentData) {
        await prisma.salaryComponent.create({
          data: {
            contractorId: contractor.id,
            ...data,
          },
        });
      }
    }
    console.log('Created salary components');

    // Create Payroll Periods
    for (const contractor of contractors) {
      const contractorWorkers = workers.filter(w => w.contractorId === contractor.id);
      await prisma.payrollPeriod.create({
        data: {
          contractorId: contractor.id,
          name: 'June 2026',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-30'),
          status: 'draft',
          createdByWorkerId: contractorWorkers[0].id,
          totalEmployees: contractorWorkers.length,
        },
      });
    }
    console.log('Created payroll periods');

    // Create team members for each contractor
    for (const contractor of contractors) {
      const teamData = [
        { name: 'James Mwangi', role: 'Site Supervisor', email: `james.m@${contractor.companyName.toLowerCase().replace(/\s+/g, '')}.ke`, phone: '+254 700 111 222', status: 'On-Site' },
        { name: 'Sarah Chengo', role: 'Safety Officer', email: `sarah.c@${contractor.companyName.toLowerCase().replace(/\s+/g, '')}.ke`, phone: '+254 700 333 444', status: 'On-Site' },
        { name: 'David Otieno', role: 'Foreman', email: `david.o@${contractor.companyName.toLowerCase().replace(/\s+/g, '')}.ke`, phone: '+254 700 555 666', status: 'Off-Duty' },
        { name: 'Alice Kamau', role: 'Project Engineer', email: `alice.k@${contractor.companyName.toLowerCase().replace(/\s+/g, '')}.ke`, phone: '+254 700 777 888', status: 'Active' },
        { name: 'Robert Maina', role: 'Electrician', email: `robert.m@${contractor.companyName.toLowerCase().replace(/\s+/g, '')}.ke`, phone: '+254 700 999 000', status: 'Active' },
      ];

      for (const data of teamData) {
        await prisma.teamMember.create({
          data: {
            contractorId: contractor.id,
            ...data,
          },
        });
      }
    }

    console.log('Created team members');

    // Create sites for each contractor
    const sites = [];
    const siteData = [
      {
        name: 'Galaxy Mall Extension',
        location: 'Nairobi CBD',
        description: 'Professional commercial development project',
      },
      {
        name: 'Westlands Office Complex',
        location: 'Nairobi',
        description: 'Modern office building development',
      },
      {
        name: 'Lakeside Residential',
        location: 'Kisumu',
        description: 'Residential housing development',
      },
      {
        name: 'Beachfront Resort',
        location: 'Mombasa',
        description: 'Luxury resort construction',
      },
      {
        name: 'Industrial Park',
        location: 'Nairobi',
        description: 'Industrial complex development',
      },
      {
        name: 'Shopping Center',
        location: 'Kisumu',
        description: 'Commercial retail space',
      },
    ];

    for (let i = 0; i < siteData.length; i++) {
      const site = await prisma.site.create({
        data: {
          contractorId: contractors[i % contractors.length].id,
          name: siteData[i].name,
          location: siteData[i].location,
          description: siteData[i].description,
        },
      });

      sites.push(site);
    }

    console.log('Created sites');

    // Create tasks for each site
    for (const site of sites) {
      const taskNames = ['Foundation', 'Framing', 'Roofing', 'Interior', 'Finishing'];
      const statuses = ['completed', 'completed', 'in-progress', 'pending', 'pending'];
      const priorities = ['high', 'high', 'medium', 'medium', 'low'];

      for (let i = 0; i < taskNames.length; i++) {
        await prisma.task.create({
          data: {
            site: { connect: { id: site.id } },
            title: taskNames[i],
            description: `${taskNames[i]} phase of ${site.name}`,
            status: statuses[i],
            priority: priorities[i],
            dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log('Created tasks');

    // Create materials for each site
    for (const site of sites) {
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
            site: { connect: { id: site.id } },
            name: material.name,
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

    // Create equipment for each site
    for (const site of sites) {
      const equipment = [
        { name: 'Excavator CAT 320', type: 'Heavy Machinery', dailyRate: 25000 },
        { name: 'Concrete Mixer', type: 'Machinery', dailyRate: 5000 },
        { name: 'Scaffolding', type: 'Safety Equipment', dailyRate: 500 },
        { name: 'Power Generator', type: 'Utility', dailyRate: 8000 },
      ];

      for (const equip of equipment) {
        await prisma.equipment.create({
          data: {
            site: { connect: { id: site.id } },
            name: equip.name,
            type: equip.type,
            dailyRate: equip.dailyRate,
            status: 'in-use',
          },
        });
      }
    }

    console.log('Created equipment');

    // Create documents for each site
    for (const site of sites) {
      const documents = [
        { name: 'Project Charter', type: 'contract' },
        { name: 'Site Safety Plan', type: 'report' },
        { name: 'Budget Estimate', type: 'invoice' },
        { name: 'Contract Agreement', type: 'contract' },
      ];

      for (const doc of documents) {
        await prisma.document.create({
          data: {
            site: { connect: { id: site.id } },
            name: doc.name,
            type: doc.type,
            fileUrl: `/documents/${doc.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          },
        });
      }
    }

    console.log('Created documents');

    // Create photos for each site
    for (const site of sites) {
      await prisma.photo.create({
        data: {
          projectId: site.id,
          imageUrl: `/images/site-${site.id}.jpg`,
          caption: `Progress photo for ${site.name}`,
        },
      });
    }

    console.log('Created photos');

    // Create visitors for each site
    for (const site of sites) {
      for (let i = 0; i < 3; i++) {
        const purposes = ['inspection', 'meeting', 'delivery', 'other'];
        await prisma.visitor.create({
          data: {
            site: { connect: { id: site.id } },
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

    // Create metrics for each site
    for (const site of sites) {
      const metricTypes = ['safety', 'progress', 'cost', 'quality'];
      for (const type of metricTypes) {
        await prisma.metric.create({
          data: {
            site: { connect: { id: site.id } },
            type: type,
            value: type === 'progress' ? Math.random() * 100 : 85 + Math.random() * 15,
            unit: type === 'cost' ? 'KES' : '%',
          },
        });
      }
    }

    console.log('Created metrics');

    // Create suppliers
    const suppliers = [];
    const supplierData = [
      { name: 'Bamburi Cement', email: 'sales@bamburi.co.ke', phone: '+254700123456' },
      { name: 'Devki Steel', email: 'info@devki.co.ke', phone: '+254700654321' },
      { name: 'Apex Steel', email: 'orders@apex.co.ke', phone: '+254700987654' },
    ];

    for (const data of supplierData) {
      const supplier = await prisma.supplier.create({ data });
      suppliers.push(supplier);
    }
    console.log('Created suppliers');

    // Create licenses for each site
    for (const site of sites) {
      const licenseNames = ['NEMA Compliance', 'County Construction Permit', 'NCA Registration', 'Fire Safety Certificate'];
      for (let i = 0; i < 2; i++) {
        await prisma.license.create({
          data: {
            site: { connect: { id: site.id } },
            name: licenseNames[i % licenseNames.length],
            licenseNumber: `LIC-${site.id.substring(site.id.length - 8)}-${i}`,
            status: 'active',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log('Created site licenses');

    // Create purchase orders for each site
    for (const site of sites) {
      for (let i = 0; i < 2; i++) {
        const supplier = suppliers[i % suppliers.length];
        await prisma.purchaseOrder.create({
          data: {
            site: { connect: { id: site.id } },
            orderNumber: `PO-${site.id.substring(site.id.length - 8)}-${i}`,
            supplierId: supplier.id,
            status: i === 0 ? 'completed' : 'pending',
            total: 50000 + Math.random() * 100000,
            items: {
              create: [
                { description: 'Material A', quantity: 10, unitPrice: 1000, totalPrice: 10000 },
                { description: 'Material B', quantity: 5, unitPrice: 2000, totalPrice: 10000 },
              ]
            }
          },
        });
      }
    }
    console.log('Created site purchase orders');

    // Create 100 dummy inventory categories
    const categoryNames = [
      'Building Materials', 'Hardware', 'Tools', 'Safety Equipment', 'Electrical',
      'Plumbing', 'Paints & Coatings', 'Fasteners', 'Adhesives', 'Sealants',
      'Insulation', 'Roofing', 'Flooring', 'Doors & Windows', 'Drywall',
      'Concrete & Masonry', 'Steel & Metal', 'Wood & Lumber', 'HVAC', 'Landscaping',
      'Fasteners', 'Hand Tools', 'Power Tools', 'Welding Equipment', 'Scaffolding',
      'Lifting Equipment', 'Safety Gear', 'First Aid', 'Fire Protection', 'Signage',
      'Electrical Panels', 'Wiring', 'Lighting', 'Switches & Outlets', 'Transformers',
      'Pipes', 'Fittings', 'Valves', 'Pumps', 'Tanks',
      'Water Heaters', 'Filters', 'Plumbing Fixtures', 'Drainage', 'Irrigation',
      'Interior Paint', 'Exterior Paint', 'Primers', 'Stains', 'Varnishes',
      'Nails', 'Screws', 'Bolts', 'Anchors', 'Rivets',
      'Glues', 'Caulks', 'Tapes', 'Epoxies', 'Sealants',
      'Thermal Insulation', 'Acoustic Insulation', 'Foam', 'Fiberglass', 'Spray Foam',
      'Shingles', 'Tiles', 'Metal Roofing', 'Membranes', 'Flashing',
      'Hardwood', 'Laminate', 'Vinyl', 'Tile', 'Carpet',
      'Entry Doors', 'Interior Doors', 'Garage Doors', 'Windows', 'Skylights',
      'Drywall Sheets', 'Joint Compound', 'Tape', 'Corners', 'Access Panels',
      'Cement', 'Concrete Mix', 'Mortar', 'Grout', 'Rebar',
      'Steel Beams', 'Aluminum', 'Copper', 'Brass', 'Stainless Steel',
      'Plywood', 'Lumber', 'Engineered Wood', 'Particle Board', 'MDF',
      'Air Conditioners', 'Furnaces', 'Ductwork', 'Vents', 'Thermostats',
      'Soil', 'Mulch', 'Plants', 'Trees', 'Irrigation Systems'
    ];

    const categoryDescriptions = [
      'Essential materials for construction projects',
      'Various hardware components and fittings',
      'Professional tools for construction work',
      'Safety equipment and protective gear',
      'Electrical components and supplies',
      'Plumbing fixtures and pipes',
      'Paints, coatings, and finishing products',
      'Various fastening solutions',
      'Adhesive products for bonding materials',
      'Sealants for joints and gaps',
      'Insulation materials for temperature control',
      'Roofing materials and accessories',
      'Flooring materials and solutions',
      'Doors and windows for buildings',
      'Drywall and wall finishing materials',
      'Concrete and masonry supplies',
      'Steel and metal building materials',
      'Wood and lumber products',
      'HVAC equipment and supplies',
      'Landscaping materials and tools',
      'Various types of fasteners',
      'Manual tools for construction',
      'Electric power tools',
      'Welding equipment and supplies',
      'Scaffolding and access equipment',
      'Material handling and lifting equipment',
      'Personal protective equipment',
      'First aid and medical supplies',
      'Fire safety equipment',
      'Safety and informational signs',
      'Electrical distribution equipment',
      'Electrical wiring and cables',
      'Lighting fixtures and bulbs',
      'Electrical switches and outlets',
      'Power transformers and electrical equipment',
      'Plumbing pipes and tubing',
      'Pipe fittings and connectors',
      'Plumbing valves and controls',
      'Water pumps and circulation equipment',
      'Water storage tanks',
      'Water heating systems',
      'Water filtration systems',
      'Plumbing fixtures and fittings',
      'Drainage systems and components',
      'Irrigation equipment and supplies',
      'Interior wall and ceiling paints',
      'Exterior protective paints and coatings',
      'Paint primers and preparatory products',
      'Wood stains and finishes',
      'Protective varnishes and sealants',
      'Various types of nails',
      'Screws for different materials',
      'Bolts and heavy-duty fasteners',
      'Wall and structural anchors',
      'Industrial rivets and fasteners',
      'Construction adhesives and glues',
      'Caulking and gap filling products',
      'Industrial and construction tapes',
      'Epoxy resins and adhesives',
      'Joint and gap sealants',
      'Building thermal insulation',
      'Soundproofing and acoustic materials',
      'Spray foam insulation products',
      'Fiberglass insulation materials',
      'Insulation foam and sealants',
      'Roofing shingles and tiles',
      'Roofing tiles and metal roofing',
      'Metal roofing systems and accessories',
      'Roofing membranes and underlayment',
      'Roofing flashing and drip edges',
      'Hardwood flooring materials',
      'Laminate flooring products',
      'Vinyl flooring solutions',
      'Ceramic and porcelain tiles',
      'Carpet and flooring materials',
      'Exterior and interior entry doors',
      'Interior room and cabinet doors',
      'Garage and overhead doors',
      'Windows and window treatments',
      'Roof skylights and light tubes',
      'Drywall sheets and panels',
      'Drywall joint compounds',
      'Drywall taping products',
      'Drywall corner beads and accessories',
      'Wall and ceiling access panels',
      'Cement and concrete products',
      'Ready-mix concrete products',
      'Mortar and grout products',
      'Tile and masonry grouts',
      'Steel reinforcing bars (rebar)',
      'Structural steel beams and columns',
      'Aluminum building materials',
      'Copper pipes and fittings',
      'Brass fittings and fixtures',
      'Stainless steel materials',
      'Plywood and sheet wood products',
      'Dimensional lumber and wood',
      'Engineered wood products',
      'Particle board and composite wood',
      'Medium density fiberboard (MDF)',
      'Air conditioning and cooling systems',
      'Heating systems and furnaces',
      'HVAC ductwork and ventilation',
      'Air vents and registers',
      'Thermostats and climate control',
      'Garden soil and growing media',
      'Landscape mulch and ground cover',
      'Plants and landscaping vegetation',
      'Trees and large landscaping plants',
      'Landscape irrigation and watering systems'
    ];

    // Create parent categories first
    const parentCategories = [];
    for (let i = 0; i < 20; i++) {
      const category = await prisma.inventoryCategory.create({
        data: {
          name: categoryNames[i],
          description: categoryDescriptions[i],
          parentId: null,
        },
      });
      parentCategories.push(category);
    }

    // Create sub-categories
    for (let i = 20; i < categoryNames.length; i++) {
      const parentIndex = Math.floor(Math.random() * parentCategories.length);
      await prisma.inventoryCategory.create({
        data: {
          name: categoryNames[i],
          description: categoryDescriptions[i],
          parentId: parentCategories[parentIndex].id,
        },
      });
    }

    console.log('Created 100 inventory categories');

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
