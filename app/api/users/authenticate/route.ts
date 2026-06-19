import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, comparePassword, saveRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({
        message: 'Email and password are required',
        error: 'Validation error',
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        contractor: true,
        teamMember: true,
        roleRelation: { include: { permissions: true } },
      },
    });

    if (!user) {
      return Response.json({
        message: 'Invalid credentials',
        error: 'Unauthenticated',
      }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return Response.json({
        message: 'Invalid credentials',
        error: 'Unauthenticated',
      }, { status: 401 });
    }

    const contractorId = user.contractor?.id || user.teamMember?.contractorId || null;
    const isSuperadmin = user.role === 'superadmin';
    const accountType = isSuperadmin ? 'admin' : 'user';
    const roleName = user.roleRelation?.name || user.role;

    let companyId: number | null = null;
    const companies: any[] = [];
    let sites: any[] = [];
    let subscriptions: any[] = [];

    if (contractorId) {
      const contractor = await prisma.contractor.findUnique({
        where: { id: contractorId },
        include: {
          subscriptionPlan: true,
          sites: { orderBy: { isPrimary: 'desc' } },
        },
      });

      if (contractor) {
        companyId = parseInt(contractor.id.replace(/\D/g, '').slice(0, 10) || '0', 10) || 0;

        const plan = contractor.subscriptionPlan;
        const planModules = plan ? JSON.stringify({
          max_clients: plan.maxProjects ?? -1,
          max_sites: plan.maxSites ?? -1,
          max_team_members: plan.maxTeamMembers ?? -1,
          max_companies: -1,
          modules: ['clients', 'workers', 'attendance', 'inventory', 'suppliers', 'visitors', 'petty_cash', 'worker_payments', 'licenses', 'machines', 'leave_requests', 'purchase_orders', 'material_deliveries', 'reports', 'files', 'settings'],
        }) : null;

        companies.push({
          id: companyId,
          admin_id: parseInt(user.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
          user_id: user.id,
          title: contractor.companyName,
          created_at: contractor.createdAt.toISOString(),
          updated_at: contractor.updatedAt.toISOString(),
          is_primary: 0,
          registration_number: contractor.licenseNo || null,
          tax_pin: null,
          nssf_number: null,
          nhif_number: null,
          helb_number: null,
          bank_name: null,
          bank_branch: null,
          bank_account_number: null,
          currency: 'KES',
          overtime_rate: '1.50',
          paye_threshold: '24000.00',
          nssf_rate: '6.00',
          nhif_rate: '2.50',
          payroll_enabled: 0,
        });

        sites = contractor.sites.map(s => ({
          id: parseInt(s.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
          title: s.name,
          description: s.description,
          status_id: 1,
          company_id: companyId,
          is_favorite: 0,
          is_primary: s.isPrimary ? 1 : 0,
        }));

        subscriptions.push({
          id: parseInt(contractor.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
          user_id: parseInt(user.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
          plan_id: parseInt(plan?.id?.replace(/\D/g, '').slice(0, 10) || '0', 10),
          status: contractor.subscriptionStatus || 'active',
          payment_method: 'offline',
          tenure: plan?.interval || 'monthly',
          charging_price: plan?.price?.toString() || '0.00',
          charging_currency: 'Kshs.',
          starts_at: contractor.subscriptionEndDate ? new Date(contractor.subscriptionEndDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : contractor.createdAt.toISOString().split('T')[0],
          ends_at: contractor.subscriptionEndDate ? contractor.subscriptionEndDate.toISOString().split('T')[0] : null,
          features: planModules,
          created_at: contractor.createdAt.toISOString(),
          updated_at: contractor.updatedAt.toISOString(),
          plan: plan ? {
            id: parseInt(plan.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
            name: plan.name,
            description: plan.description || '',
            max_sites: plan.maxSites ?? -1,
            max_clients: plan.maxProjects ?? -1,
            max_team_members: plan.maxTeamMembers ?? -1,
            max_companies: -1,
            plan_type: plan.price === 0 ? 'free' : 'paid',
            image: null,
            modules: JSON.stringify(['clients', 'workers', 'attendance', 'inventory', 'suppliers', 'visitors', 'petty_cash', 'worker_payments', 'licenses', 'machines', 'leave_requests', 'purchase_orders', 'material_deliveries', 'reports', 'files', 'settings']),
            monthly_price: plan.price?.toString() || '0.00',
            monthly_discounted_price: plan.price?.toString() || '0.00',
            yearly_price: plan.price?.toString() || '0.00',
            yearly_discounted_price: plan.price?.toString() || '0.00',
            lifetime_price: plan.price?.toString() || '0.00',
            lifetime_discounted_price: plan.price?.toString() || '0.00',
            status: plan.isActive ? 'active' : 'inactive',
            created_at: plan.createdAt.toISOString(),
            updated_at: plan.updatedAt.toISOString(),
          } : null,
        });
      }
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId,
    });

    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    const firstName = user.name?.split(' ')[0] || '';
    const lastName = user.name?.split(' ').slice(1).join(' ') || '';

    const roleNameStr = user.roleRelation?.name || user.role;
    const roleDisplay = isSuperadmin ? 'admin' : roleNameStr;

    return Response.json({
      error: false,
      message: `${roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1)} login successful`,
      access_token: accessToken,
      token_type: 'Bearer',
      account_type: accountType,
      role: roleDisplay,
      company_id: companyId,
      user: {
        id: parseInt(user.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
        first_name: firstName,
        last_name: lastName,
        phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
        email: user.email,
        address: null,
        city: null,
        state: null,
        country: null,
        zip: null,
        dob: null,
        doj: null,
        photo: null,
        avatar: user.avatar || 'avatar.png',
        active_status: 0,
        dark_mode: 0,
        messenger_color: null,
        lang: 'en',
        email_verified_at: user.createdAt.toISOString(),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
        status: 1,
        registration_status: 'completed',
        country_code: null,
        country_iso_code: null,
        roles: user.roleRelation ? [{
          id: parseInt(user.roleRelation.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
          name: user.roleRelation.name,
          guard_name: 'web',
          created_at: user.roleRelation.createdAt.toISOString(),
          updated_at: user.roleRelation.updatedAt.toISOString(),
          pivot: {
            model_type: 'App\\Models\\User',
            model_id: parseInt(user.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
            role_id: parseInt(user.roleRelation.id.replace(/\D/g, '').slice(0, 10) || '0', 10),
          },
        }] : [],
        companies,
      },
      sites,
      subscriptions,
      redirect_url: isSuperadmin ? '/master-panel/home' : '/home',
    });
  } catch (error: any) {
    return Response.json({
      message: error.message || 'Authentication failed',
      error: 'Server error',
    }, { status: 500 });
  }
}