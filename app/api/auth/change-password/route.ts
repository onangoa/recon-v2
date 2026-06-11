import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// In a real app, use a password hashing library like bcrypt
// import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    // In a real app, get userId from session
    // For demo, we'll use the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // In a real app:
    // const isMatch = await bcrypt.compare(currentPassword, user.password);
    // if (!isMatch) return NextResponse.json({ message: 'Invalid current password' }, { status: 400 });
    
    // For demo, we just check direct equality or assume it's fine
    if (user.password !== currentPassword && user.password !== 'admin123') { // admin123 is a common demo password
       return NextResponse.json({ message: 'Invalid current password' }, { status: 400 });
    }

    // const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword }, // Store hashed in real app
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ message: 'Failed to change password' }, { status: 500 });
  }
}
