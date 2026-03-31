// Predefined school data
// In production, this would be stored securely on the backend

import type { School } from '@/types';

// Predefined schools with their information
// This data will be automatically loaded into localStorage when the app first runs
export const PREDEFINED_SCHOOLS: Omit<School, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Greenwood High School',
    campusName: 'Main Campus Model Town',
    address: '123 Main Street, Model Town, Lahore, Punjab, Pakistan',
    status: 'ACTIVE',
    street: '123 Main Street',
    area: 'Model Town',
    city: 'Lahore',
    province: 'PUNJAB',
    country: 'Pakistan',
    phone: '+92-42-1234567',
    phoneNumbers: ['+92-42-1234567', '+92-42-1234568'],
    email: 'info@greenwoodhigh.edu.pk',
    website: 'https://www.greenwoodhigh.edu.pk',
    whatsappNumber: '+92-300-1234567',
    logo: 'https://via.placeholder.com/200x200?text=Greenwood+High',
    schoolType: 'Private',
    level: 'Higher Secondary',
    yearOfEstablishment: 1999,
    registrationNumber: 'REG-1990-001',
  },
];

/**
 * Get predefined school by ID (matching schoolId from credentials)
 */
export function getPredefinedSchoolById(schoolId: string): Omit<School, 'id' | 'createdAt' | 'updatedAt'> | null {
  // Map schoolId to predefined school index
  // school-1 maps to first predefined school
  if (schoolId === 'school-1') {
    return PREDEFINED_SCHOOLS[0] || null;
  }
  return null;
}

