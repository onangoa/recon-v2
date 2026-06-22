import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, comparePassword, saveRefreshToken } from '@/lib/jwt';
import { cuidToInt } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: true, message: 'Email and password are required' }, { status: 422 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        contractor: { include: { subscriptionPlan: true, sites: { orderBy: { isPrimary: 'desc' } } } },
        teamMember: { include: { contractor: { include: { subscriptionPlan: true, sites: { orderBy: { isPrimary: 'desc' } } } } } },
        roleRelation: { include: { permissions: true } },
      },
    });

    if (!user) {
      return Response.json({ error: true, message: 'Invalid credentials!' }, { status: 200 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return Response.json({ error: true, message: 'Invalid credentials!' }, { status: 200 });
    }

    const contractor = user.contractor || user.teamMember?.contractor || null;
    const contractorId = user.contractor?.id || user.teamMember?.contractorId || null;
    const isSuperadmin = user.role === 'superadmin';
    const roleName = user.roleRelation?.name || user.role;
    const roleDisplay = isSuperadmin ? 'admin' : roleName;
    const accountType = isSuperadmin ? 'admin' : 'user';
    const plan = contractor?.subscriptionPlan || null;

    const companyId = contractor ? cuidToInt(contractor.id) : null;

    const companies = contractor ? [{
      id: companyId,
      admin_id: cuidToInt(user.id),
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
      pivot: {
        user_id: cuidToInt(user.id),
        company_id: companyId,
      },
    }] : [];

    const sites = contractor ? contractor.sites.map(s => ({
      id: cuidToInt(s.id),
      title: s.name,
      description: s.description || '',
      status_id: 1,
      company_id: companyId,
      is_favorite: 0,
      is_primary: s.isPrimary ? 1 : 0,
    })) : [];

    const modules = JSON.stringify(['clients', 'workers', 'attendance', 'inventory', 'suppliers', 'visitors', 'petty_cash', 'worker_payments', 'licenses', 'machines', 'leave_requests', 'purchase_orders', 'material_deliveries', 'reports', 'files', 'settings']);
    const features = JSON.stringify({
      max_clients: plan?.maxProjects ?? -1,
      max_sites: plan?.maxSites ?? -1,
      max_team_members: plan?.maxTeamMembers ?? -1,
      max_companies: -1,
      modules: ['clients', 'workers', 'attendance', 'inventory', 'suppliers', 'visitors', 'petty_cash', 'worker_payments', 'licenses', 'machines', 'leave_requests', 'purchase_orders', 'material_deliveries', 'reports', 'files', 'settings'],
    });

    const subscriptions = contractor ? [{
      id: cuidToInt(contractor.id),
      user_id: cuidToInt(user.id),
      plan_id: plan ? cuidToInt(plan.id) : 0,
      status: contractor.subscriptionStatus || 'active',
      payment_method: 'offline',
      tenure: plan?.interval || 'monthly',
      charging_price: String(plan?.price ?? 0),
      charging_currency: 'Kshs.',
      starts_at: contractor.subscriptionEndDate
        ? new Date(contractor.subscriptionEndDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : contractor.createdAt.toISOString().split('T')[0],
      ends_at: contractor.subscriptionEndDate
        ? contractor.subscriptionEndDate.toISOString().split('T')[0]
        : null,
      features,
      created_at: contractor.createdAt.toISOString(),
      updated_at: contractor.updatedAt.toISOString(),
      plan: plan ? {
        id: cuidToInt(plan.id),
        name: plan.name,
        description: plan.description || '',
        max_sites: plan.maxSites ?? -1,
        max_clients: plan.maxProjects ?? -1,
        max_team_members: plan.maxTeamMembers ?? -1,
        max_companies: -1,
        plan_type: (plan.price === 0) ? 'free' : 'paid',
        image: null,
        modules,
        monthly_price: String(plan.price ?? 0),
        monthly_discounted_price: String(plan.price ?? 0),
        yearly_price: String(plan.price ?? 0),
        yearly_discounted_price: String(plan.price ?? 0),
        lifetime_price: String(plan.price ?? 0),
        lifetime_discounted_price: String(plan.price ?? 0),
        status: plan.isActive ? 'active' : 'inactive',
        created_at: plan.createdAt.toISOString(),
        updated_at: plan.updatedAt.toISOString(),
      } : null,
    }] : [];

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId,
    });

    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    const firstName = (user.name || '').split(' ')[0] || '';
    const lastName = (user.name || '').split(' ').slice(1).join(' ') || '';

    return Response.json({
      error: false,
      message: `${roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1)} login successful`,
      access_token: accessToken,
      token_type: 'Bearer',
      account_type: accountType,
      role: roleDisplay,
      company_id: companyId,
      user: {
        id: cuidToInt(user.id),
        first_name: firstName,
        last_name: lastName,
        phone: user.teamMember?.phone || contractor?.phoneNumber || null,
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
          id: cuidToInt(user.roleRelation.id),
          name: user.roleRelation.name,
          guard_name: 'web',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pivot: {
            model_type: 'App\\Models\\User',
            model_id: cuidToInt(user.id),
            role_id: cuidToInt(user.roleRelation.id),
          },
        }] : [],
        companies,
      },
      sites,
      subscriptions,
      redirect_url: isSuperadmin ? '/master-panel/home' : '/home',
    });
  } catch (error: any) {
    console.error('[AUTHENTICATE ERROR]', error);
    return Response.json({ error: true, message: error.message || 'Authentication failed' }, { status: 200 });
  }
}