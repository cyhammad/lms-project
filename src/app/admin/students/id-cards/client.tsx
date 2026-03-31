'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { CreditCard, School } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSchools } from '@/hooks/use-schools';
import type { Student, AcademicSession, Class, Section } from '@/types';
import { apiClient } from '@/lib/api-client';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { getStorageUrl } from '@/lib/storage-url';

// ID Card Template Types
type TemplateId = 'professional-blue' | 'classic-green';

interface Template {
    id: TemplateId;
    name: string;
    description: string;
    icon: React.ElementType;
    preview: string;
}

const templates: Template[] = [
    {
        id: 'professional-blue',
        name: 'Professional Blue',
        description: 'Clean vertical design with blue accent stripe',
        icon: CreditCard,
        preview: 'bg-gradient-to-br from-blue-600 to-blue-700',
    },
    {
        id: 'classic-green',
        name: 'Classic Green',
        description: 'Clean design with punch hole and green accents',
        icon: CreditCard,
        preview: 'bg-gradient-to-br from-green-500 to-green-600',
    },
];

interface IDCardsClientProps {
    user: any;
}

export default function IDCardsClient({ user }: IDCardsClientProps) {
    const { schools } = useSchools();
    const { sessionId: globalSessionId, sessions } = useAdminSession();

    // Data states
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    // Loading states
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Filter states (session is set globally in header)
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('professional-blue');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<string>('');

    const previewRef = useRef<HTMLDivElement | null>(null);

    // Load classes when global session is set
    useEffect(() => {
        const loadClasses = async () => {
            if (!globalSessionId) {
                setClasses([]);
                setSections([]);
                setStudents([]);
                setSelectedClass('');
                setSelectedSection('');
                return;
            }

            try {
                setLoadingClasses(true);
                const response = await apiClient<{ classes: Class[] }>(`/classes?sessionId=${globalSessionId}`);
                setClasses(response.classes || []);
                setSections([]);
                setStudents([]);
                setSelectedClass('');
                setSelectedSection('');
            } catch (error) {
                console.error('Error loading classes:', error);
                setClasses([]);
            } finally {
                setLoadingClasses(false);
            }
        };

        loadClasses();
    }, [globalSessionId]);

    // Load sections when class is selected
    useEffect(() => {
        const loadSections = async () => {
            if (!selectedClass) {
                setSections([]);
                setStudents([]);
                setSelectedSection('');
                return;
            }

            try {
                setLoadingSections(true);
                const response = await apiClient<{ sections: Section[] }>(`/sections?classId=${selectedClass}`);
                setSections(response.sections || []);
                // Clear dependent selections
                setStudents([]);
                setSelectedSection('');
            } catch (error) {
                console.error('Error loading sections:', error);
                setSections([]);
            } finally {
                setLoadingSections(false);
            }
        };

        loadSections();
    }, [selectedClass]);

    // Load students when section is selected (fetch with minimal params, filter client-side for backend compatibility)
    useEffect(() => {
        const loadStudents = async () => {
            if (!selectedSection) {
                setStudents([]);
                return;
            }

            try {
                setLoadingStudents(true);
                // Many backends don't support sectionId/classId/academicSession query params.
                // Fetch a larger set and filter client-side so students always show when they exist.
                const params = new URLSearchParams();
                params.append('page', '1');
                params.append('limit', '2000');
                params.append('isActive', 'true');

                const response = await apiClient<{ students?: Student[] } | Student[]>(`/students?${params.toString()}`);
                // Backend may return { students: [...] } or the array directly (e.g. data = [...])
                const allStudents: Student[] = Array.isArray(response)
                    ? response
                    : (response?.students ?? []);

                const session = globalSessionId ? sessions.find(s => s.id === globalSessionId) : null;
                const sessionName = session?.name;

                const filtered = allStudents.filter((s) => {
                    const matchSection = s.sectionId === selectedSection;
                    const matchClass =
                        !selectedClass ||
                        (s.classId === selectedClass || s.classApplyingFor === selectedClass);
                    const matchSession =
                        !globalSessionId ||
                        s.academicSession === sessionName ||
                        s.academicSession === globalSessionId;

                    return matchSection && matchClass && matchSession;
                });

                setStudents(filtered);
            } catch (error) {
                console.error('Error loading students:', error);
                setStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };

        loadStudents();
    }, [selectedSection, selectedClass, globalSessionId, sessions]);

    // Filter students (already filtered by API, but keep for consistency)
    const filteredStudents = useMemo(() => {
        return students.filter(s => s.isActive);
    }, [students]);

    const selectedStudents = useMemo(() => {
        return filteredStudents.filter(s => selectedStudentIds.has(s.id));
    }, [filteredStudents, selectedStudentIds]);

    // Get available options for dropdowns (session is global from header)
    const availableClasses = useMemo(() => {
        return classes.sort((a, b) => a.name.localeCompare(b.name));
    }, [classes]);

    const availableSections = useMemo(() => {
        return sections.sort((a, b) => a.name.localeCompare(b.name));
    }, [sections]);

    // Preview student (first selected or first filtered)
    const previewStudent = useMemo(() => {
        if (selectedStudents.length > 0) {
            return selectedStudents[0];
        }
        if (filteredStudents.length > 0) {
            return filteredStudents[0];
        }
        return null;
    }, [selectedStudents, filteredStudents]);

    const toggleStudent = (studentId: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setSelectedStudentIds(newSet);
    };

    const selectAll = () => {
        if (selectedStudentIds.size === filteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const clearFilters = () => {
        setSelectedClass('');
        setSelectedSection('');
        setSelectedStudentIds(new Set());
    };

    const getStudentName = (student: Student) => {
        return student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';
    };

    const getClassName = (classId?: string) => {
        if (!classId) return 'N/A';
        const cls = classes.find(c => c.id === classId);
        return cls ? cls.name : 'N/A';
    };

    const getSectionName = (sectionId?: string) => {
        if (!sectionId) return 'N/A';
        const section = sections.find(s => s.id === sectionId);
        return section ? section.name : 'N/A';
    };


    // Helper to check if a URL is valid for image loading (not a placeholder or invalid URL)
    const isValidImageUrl = (url: string | undefined | null): boolean => {
        if (!url) return false;
        // Skip placeholder URLs and obviously invalid URLs
        const invalidPatterns = [
            'via.placeholder.com',
            'placeholder.com',
            'placehold.it',
            'placekitten.com',
            'dummyimage.com',
            'fakeimg.pl',
        ];
        const lowerUrl = url.toLowerCase();
        if (invalidPatterns.some(pattern => lowerUrl.includes(pattern))) {
            return false;
        }
        // Check if it starts with a valid protocol or is a data URL
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/');
    };

    // ID Card Component
    const IDCard = ({ student, templateId }: { student: Student; templateId: TemplateId }) => {
        const studentName = getStudentName(student);
        const studentId = student.studentId || student.bFormCrc || 'N/A';
        const className = getClassName(student.classApplyingFor);
        const session = student.academicSession || 'N/A';

        const cardProps = {
            'data-student-id': student.id,
        };

        if (templateId === 'professional-blue') {
            const school = user?.schoolId ? schools.find(s => s.id === user.schoolId) : null;
            const schoolName = school?.name || 'School Name';
            const schoolLogo = school?.logo;
            const hasValidSchoolLogo = isValidImageUrl(schoolLogo);
            const studentPhotoUrl = getStorageUrl(student.studentPhoto);
            const hasValidStudentPhoto = isValidImageUrl(studentPhotoUrl);

            return (
                <div {...cardProps} className="w-full max-w-[340px] aspect-[85.6/53.98] mx-auto bg-white shadow-2xl border border-gray-300 relative overflow-hidden">
                    {/* Blue vertical stripe on the left with enhanced design */}
                    <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-b from-blue-700 via-blue-600 to-blue-700">
                        {/* Subtle geometric pattern */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 8px,
                  rgba(255,255,255,0.15) 8px,
                  rgba(255,255,255,0.15) 16px
                )`
                            }}></div>
                        </div>

                        {/* Decorative top accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>

                        {/* Rotated text showing ID Card */}
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center">
                            <p className="text-white text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-sm">
                                Student ID Card
                            </p>
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="ml-16 h-full flex flex-col p-4 min-h-0">
                        {/* School logo and name at top */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 flex-shrink-0">
                            {hasValidSchoolLogo ? (
                                <img
                                    src={schoolLogo!}
                                    alt={schoolName}
                                    className="h-7 w-auto object-contain max-w-[130px]"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        // Hide the image and show nothing (parent still has school name)
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="h-7 w-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <School className="h-4 w-4 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[10px] font-bold text-gray-800 leading-tight uppercase tracking-wider">
                                    {schoolName}
                                </h3>
                            </div>
                        </div>

                        {/* Student photo and name in center */}
                        <div className="flex items-center gap-3 mb-3 flex-1 min-h-0">
                            {hasValidStudentPhoto ? (
                                <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 shadow-md overflow-hidden flex-shrink-0 ring-2 ring-blue-50">
                                    <img
                                        src={studentPhotoUrl!}
                                        alt={studentName}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<span class="text-xl font-bold text-blue-700 flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-blue-100">${studentName.charAt(0).toUpperCase()}</span>`;
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-50">
                                    <span className="text-xl font-bold text-blue-700">{studentName.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-gray-900 leading-tight mb-1 tracking-tight">{studentName}</h2>
                                <div className="inline-block px-2 py-0.5 bg-blue-50 rounded-md">
                                    <p className="text-xs text-blue-700 font-semibold">{className}</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact/ID information at bottom */}
                        <div className="space-y-1 pt-2 border-t border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">ID:</span>
                                <span className="text-[11px] text-gray-900 font-bold">{studentId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">SESSION:</span>
                                <span className="text-[11px] text-gray-900 font-semibold">{session}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (templateId === 'classic-green') {
            const school = user?.schoolId ? schools.find(s => s.id === user.schoolId) : null;
            const schoolName = school?.name || 'School Name';
            const studentPhotoUrl = getStorageUrl(student.studentPhoto);

            return (
                <div {...cardProps} className="relative w-full max-w-[320px] aspect-[320/460] mx-auto bg-white shadow-xl overflow-hidden flex flex-col">
                    {/* Punch hole */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-200 shadow-inner z-10" />

                    {/* Header */}
                    <div className="pt-10 px-8 text-center">
                        {/* School Name */}
                        <div className="mb-2">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                {schoolName}
                            </h2>
                        </div>
                        {/* <h1 className="text-2xl font-bold tracking-wide text-gray-900">
              STUDENT ID
            </h1> */}
                        <div className="mt-1 h-[1px] w-full mx-auto bg-green-500 rounded-full" />
                    </div>

                    {/* Profile image */}
                    <div className="mt-4 flex justify-center flex-shrink-0">
                        <div className="relative w-50 h-50 rounded-full bg-gray-200 overflow-hidden ring-4 ring-green-500/20">
                            {studentPhotoUrl ? (
                                <img
                                    src={studentPhotoUrl}
                                    alt={studentName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-5xl font-bold text-gray-600">{studentName.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info - flex-grow to push content down */}
                    <div className="flex-1 flex flex-col justify-center px-8 pb-4 pt-5 space-y-2">
                        {/* Name */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-600">Name</span>
                            <span className="text-sm font-semibold text-gray-900">
                                {studentName}
                            </span>
                        </div>

                        {/* Class */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-600">Class</span>
                            <span className="text-sm font-semibold text-green-600">
                                {className}
                            </span>
                        </div>

                        {/* ID Number */}
                        <div className="flex items-center justify-between pb-2 ">
                            <span className="text-sm font-medium text-gray-600">ID Number</span>
                            <span className="text-sm font-semibold text-gray-900">
                                {studentId}
                            </span>
                        </div>
                    </div>

                    {/* Footer text */}
                    <div className="px-8 pb-4 text-center">
                        <p className="text-xs text-gray-400 font-medium">
                            Student Identification Card
                        </p>
                    </div>

                    {/* Bottom accent */}
                    {/* <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-500" /> */}
                </div>
            );
        }

        // Fallback to professional-blue template
        const school = user?.schoolId ? schools.find(s => s.id === user.schoolId) : null;
        const schoolName = school?.name || 'School Name';
        const schoolLogo = school?.logo;
        const hasValidSchoolLogo = isValidImageUrl(schoolLogo);
        const studentPhotoUrl2 = getStorageUrl(student.studentPhoto);
        const hasValidStudentPhoto = isValidImageUrl(studentPhotoUrl2);

        return (
            <div {...cardProps} className="w-full max-w-[340px] aspect-[85.6/53.98] mx-auto bg-white shadow-2xl border border-gray-300 relative overflow-hidden">
                {/* Blue vertical stripe on the left with enhanced design */}
                <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-b from-blue-700 via-blue-600 to-blue-700">
                    {/* Subtle geometric pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8px,
                rgba(255,255,255,0.15) 8px,
                rgba(255,255,255,0.15) 16px
              )`
                        }}></div>
                    </div>

                    {/* Decorative top accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>

                    {/* Rotated text showing ID Card */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center">
                        <p className="text-white text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-sm">
                            Student ID Card
                        </p>
                    </div>
                </div>

                {/* Main content area */}
                <div className="ml-16 h-full flex flex-col p-4">
                    {/* School logo and name at top */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                        {hasValidSchoolLogo ? (
                            <img
                                src={schoolLogo!}
                                alt={schoolName}
                                className="h-7 w-auto object-contain max-w-[130px]"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="h-7 w-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                                <School className="h-4 w-4 text-white" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[10px] font-bold text-gray-800 leading-tight uppercase tracking-wider">
                                {schoolName}
                            </h3>
                        </div>
                    </div>

                    {/* Student photo and name in center */}
                    <div className="flex items-center gap-3 mb-3 flex-1">
                        {hasValidStudentPhoto ? (
                            <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 shadow-md overflow-hidden flex-shrink-0 ring-2 ring-blue-50">
                                <img
                                    src={studentPhotoUrl2!}
                                    alt={studentName}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<span class="text-xl font-bold text-blue-700 flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-blue-100">${studentName.charAt(0).toUpperCase()}</span>`;
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-50">
                                <span className="text-xl font-bold text-blue-700">{studentName.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-gray-900 leading-tight mb-1 tracking-tight">{studentName}</h2>
                            <div className="inline-block px-2 py-0.5 bg-blue-50 rounded-md">
                                <p className="text-xs text-blue-700 font-semibold">{className}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact/ID information at bottom */}
                    <div className="space-y-1 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">ID:</span>
                            <span className="text-[11px] text-gray-900 font-bold">{studentId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">SESSION:</span>
                            <span className="text-[11px] text-gray-900 font-semibold">{session}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Helper: wait for images inside an element to load before capturing (with timeout)
    const waitForImages = (element: HTMLElement, timeoutMs: number = 5000): Promise<void> => {
        return new Promise((resolve) => {
            const images = element.querySelectorAll('img');
            if (images.length === 0) {
                setTimeout(resolve, 100);
                return;
            }

            let loadedCount = 0;
            const totalImages = images.length;
            let resolved = false;

            const done = () => {
                if (resolved) return;
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolved = true;
                    setTimeout(resolve, 100);
                }
            };

            // Set timeout to prevent infinite waiting
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn('Image loading timeout, proceeding anyway');
                    resolve();
                }
            }, timeoutMs);

            images.forEach((img) => {
                if (img.complete && img.naturalHeight !== 0) {
                    done();
                } else {
                    img.onload = () => {
                        clearTimeout(timeoutId);
                        done();
                    };
                    img.onerror = () => {
                        clearTimeout(timeoutId);
                        done(); // Continue even if image fails
                    };
                }
            });

            // If all images are already loaded
            if (loadedCount === totalImages) {
                clearTimeout(timeoutId);
                resolved = true;
                setTimeout(resolve, 100);
            }
        });
    };

    const getBaseDimensions = (templateId: TemplateId) => {
        if (templateId === 'classic-green') {
            // Vertical/portrait card
            return { width: 320, height: 460, isLandscape: false };
        }
        // professional-blue and fallback (aspect 85.6/53.98) - horizontal/landscape
        const width = 340;
        const height = Math.round(width * (53.98 / 85.6));
        return { width, height, isLandscape: true };
    };

    // Render a single student's card off-screen and return a PNG data URL plus dimensions
    const renderStudentCardToPng = async (student: Student, templateId: TemplateId) => {
        const { toPng } = await import('html-to-image');

        const { width: baseWidth, height: baseHeight } = getBaseDimensions(templateId);

        // Create a temporary container that's visible but off-screen
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = `${baseWidth + 100}px`;
        tempContainer.style.height = `${baseHeight + 100}px`;
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '20px';
        tempContainer.style.zIndex = '-1000';
        document.body.appendChild(tempContainer);

        // Create a wrapper div for the card with explicit dimensions
        const cardWrapper = document.createElement('div');
        cardWrapper.style.width = `${baseWidth}px`;
        cardWrapper.style.backgroundColor = '#ffffff';
        cardWrapper.setAttribute('data-card-wrapper', 'true');
        tempContainer.appendChild(cardWrapper);

        // Import React and ReactDOM
        const React = await import('react');
        const ReactDOM = await import('react-dom/client');

        // Render the IDCard component
        const root = ReactDOM.createRoot(cardWrapper);

        await new Promise<void>((resolve) => {
            root.render(
                React.createElement(IDCard, { student, templateId })
            );
            // Wait for React to finish rendering
            setTimeout(resolve, 100);
        });

        // Wait for additional frames to ensure rendering is complete
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 300);
                });
            });
        });

        // Find the actual card element
        const cardElement = cardWrapper.querySelector<HTMLElement>('[data-student-id]');
        if (!cardElement) {
            root.unmount();
            document.body.removeChild(tempContainer);
            throw new Error('Card element not found after rendering');
        }

        // Force layout calculation
        void cardElement.offsetHeight;

        // Verify card has content
        const rect = cardElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const rect2 = cardElement.getBoundingClientRect();
            if (rect2.width === 0 || rect2.height === 0) {
                root.unmount();
                document.body.removeChild(tempContainer);
                throw new Error(`Card has no dimensions: ${rect2.width}x${rect2.height}`);
            }
        }

        // Wait for images to load
        await waitForImages(cardElement, 8000);
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Capture the card element with high resolution for better PDF quality
        let dataUrl: string;
        try {
            dataUrl = await toPng(cardElement, {
                backgroundColor: '#ffffff',
                quality: 1,
                cacheBust: true,
                pixelRatio: 4, // High resolution for crisp PDF output
                skipFonts: true,
                style: {
                    transform: 'none',
                },
            });
        } catch (captureError) {
            console.error('toPng capture error:', captureError);
            root.unmount();
            document.body.removeChild(tempContainer);
            throw new Error(`Failed to capture card: ${captureError}`);
        }

        if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 1000) {
            root.unmount();
            document.body.removeChild(tempContainer);
            throw new Error('Failed to generate image - empty or invalid data URL');
        }

        // Load the image to get actual dimensions
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Image load timeout'));
            }, 5000);
            img.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load generated image'));
            };
        });

        // Cleanup
        root.unmount();
        document.body.removeChild(tempContainer);

        return { dataUrl, width: img.width, height: img.height };
    };

    const handleDownload = async () => {
        if (!previewStudent && selectedStudents.length === 0) return;

        const studentsToExport = selectedStudents.length > 0
            ? selectedStudents
            : previewStudent
                ? [previewStudent]
                : [];

        if (studentsToExport.length === 0) return;

        try {
            setIsDownloading(true);
            setDownloadProgress('Initializing...');

            const { default: jsPDF } = await import('jspdf');

            // Helper function to create PDF from a student by rendering off-screen
            const createPDFFromStudent = async (student: Student, templateId: TemplateId): Promise<InstanceType<typeof jsPDF>> => {
                const { dataUrl, width: imgWidth, height: imgHeight } = await renderStudentCardToPng(student, templateId);
                const { isLandscape, width: baseWidth, height: baseHeight } = getBaseDimensions(templateId);

                // Standard ID card size in mm (CR80 card: 85.6mm x 53.98mm for landscape, swap for portrait)
                // For classic-green (portrait), we use a taller format
                let pdfWidthMm: number;
                let pdfHeightMm: number;

                if (templateId === 'classic-green') {
                    // Portrait card - use a custom size that matches the aspect ratio
                    // Base: 320x460 -> ratio 0.696
                    pdfWidthMm = 60; // 60mm wide
                    pdfHeightMm = Math.round(60 * (460 / 320)); // ~86mm tall
                } else {
                    // Standard CR80 ID card dimensions (credit card size)
                    pdfWidthMm = 85.6;
                    pdfHeightMm = 53.98;
                }

                // Create PDF with millimeter units for better print quality
                const pdf = new jsPDF({
                    orientation: isLandscape ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: [pdfWidthMm, pdfHeightMm],
                    compress: true,
                });

                // Add the high-resolution image scaled to fit the PDF page
                // The image is 4x resolution (pixelRatio: 4), so it will be crisp when scaled down
                pdf.addImage(
                    dataUrl,
                    'PNG',
                    0,
                    0,
                    pdfWidthMm,
                    pdfHeightMm,
                    undefined, // alias
                    'FAST' // compression
                );

                return pdf;
            };

            // Single student -> render off-screen and download directly
            if (studentsToExport.length === 1) {
                setDownloadProgress('Generating PDF...');
                const student = studentsToExport[0];

                try {
                    const pdf = await createPDFFromStudent(student, selectedTemplate);
                    const fileId = student.studentId || student.bFormCrc || 'student';
                    const sanitizedFileId = fileId.replace(/[^a-zA-Z0-9-_]/g, '_');
                    pdf.save(`${sanitizedFileId}-id-card.pdf`);
                } catch (error) {
                    console.error('Error generating single PDF:', error);
                    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                return;
            }

            // Multiple students -> render each off-screen sequentially and create a single PDF
            let successCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            // A4 dimensions in mm
            const a4Width = 210;
            const a4Height = 297;
            const margin = 10;
            const gapMm = 1.5; // ~4px gap between cards

            // Usable area
            const usableWidth = a4Width - 2 * margin;
            const usableHeight = a4Height - 2 * margin;

            const { isLandscape } = getBaseDimensions(selectedTemplate);

            let cardWidthMm: number;
            let cardHeightMm: number;

            if (selectedTemplate === 'classic-green') {
                cardWidthMm = 60;
                cardHeightMm = Math.round(60 * (460 / 320));
            } else {
                cardWidthMm = 85.6;
                cardHeightMm = 53.98;
            }

            // Calculate grid layout
            const cols = Math.floor((usableWidth + gapMm) / (cardWidthMm + gapMm));
            const rows = Math.floor((usableHeight + gapMm) / (cardHeightMm + gapMm));
            const cardsPerPage = cols * rows;

            // Calculate spacing to center the grid
            const gridWidth = cols * cardWidthMm + (cols > 1 ? (cols - 1) * gapMm : 0);
            const gridHeight = rows * cardHeightMm + (rows > 1 ? (rows - 1) * gapMm : 0);
            const startX = margin + (usableWidth - gridWidth) / 2;
            const startY = margin + (usableHeight - gridHeight) / 2;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });

            for (let i = 0; i < studentsToExport.length; i++) {
                const student = studentsToExport[i];
                const studentIdAttr = student.studentId || student.bFormCrc || `student-${i + 1}`;

                try {
                    setDownloadProgress(`Generating ${i + 1} of ${studentsToExport.length}...`);
                    const { dataUrl } = await renderStudentCardToPng(student, selectedTemplate);

                    // If we need a new page (and it's not the very first card)
                    if (i > 0 && i % cardsPerPage === 0) {
                        pdf.addPage();
                    }

                    // Calculate position on current page
                    const posOnPage = i % cardsPerPage;
                    const col = posOnPage % cols;
                    const row = Math.floor(posOnPage / cols);

                    const x = startX + (col * (cardWidthMm + gapMm));
                    const y = startY + (row * (cardHeightMm + gapMm));

                    pdf.addImage(
                        dataUrl,
                        'PNG',
                        x,
                        y,
                        cardWidthMm,
                        cardHeightMm,
                        undefined,
                        'FAST'
                    );

                    // Add a subtle border around each card for cutting
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.1);
                    pdf.rect(x, y, cardWidthMm, cardHeightMm);

                    successCount++;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[${i + 1}/${studentsToExport.length}] ✗ Failed: ${studentIdAttr}`, error);
                    errors.push(`${studentIdAttr}: ${errorMsg}`);
                    failCount++;
                }

                // Small delay between generations to prevent memory issues
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (successCount === 0) {
                alert(`Failed to generate any PDFs.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`);
                return;
            }

            setDownloadProgress('Saving PDF file...');
            pdf.save('student-id-cards.pdf');

            if (failCount > 0) {
                alert(`Generated ${successCount} ID card(s) successfully.\n${failCount} failed:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
            }

        } catch (error) {
            console.error('Error in download process:', error);
            alert(`Failed to generate ID card(s): ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsDownloading(false);
            setDownloadProgress('');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Student ID Cards</h1>
                <p className="text-gray-600 mt-1">Generate modern ID cards for your students</p>
            </div>

            {/* Filters and Template Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters & Template</CardTitle>
                    <CardDescription>Select class, section, and template (session is set in header)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Class Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Class {loadingClasses && <span className="text-gray-400 text-xs">(Loading...)</span>}
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedStudentIds(new Set());
                                }}
                                disabled={!globalSessionId || loadingClasses}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] text-sm bg-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Class</option>
                                {availableClasses.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Section {loadingSections && <span className="text-gray-400 text-xs">(Loading...)</span>}
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => {
                                    setSelectedSection(e.target.value);
                                    setSelectedStudentIds(new Set());
                                }}
                                disabled={!selectedClass || loadingSections}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] text-sm bg-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Section</option>
                                {availableSections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Template Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Template
                            </label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value as TemplateId)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] text-sm bg-white outline-none"
                            >
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(selectedClass || selectedSection) && (
                        <div className="mt-4">
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preview and Student Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card Preview */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Card Preview</CardTitle>
                                    <CardDescription>Preview of the selected template</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDownload}
                                    disabled={isDownloading || (!previewStudent && selectedStudents.length === 0)}
                                    className="min-w-[150px]"
                                >
                                    {isDownloading
                                        ? downloadProgress || 'Generating...'
                                        : 'Download PDF'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {previewStudent ? (
                                <div className="flex justify-center overflow-visible">
                                    <div ref={previewRef} className="w-full flex justify-center">
                                        <IDCard student={previewStudent} templateId={selectedTemplate} />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-500">
                                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-sm">No students available to preview</p>
                                    <p className="text-xs mt-1">Apply filters to see students</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Student Selection List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Select Students</CardTitle>
                                    <CardDescription>
                                        {loadingStudents ? (
                                            'Loading students...'
                                        ) : filteredStudents.length > 0 ? (
                                            `${filteredStudents.length} student(s) found • ${selectedStudentIds.size} selected`
                                        ) : selectedSection ? (
                                            'No students found in this section'
                                        ) : (
                                            'Select a section to view students'
                                        )}
                                    </CardDescription>
                                </div>
                                {filteredStudents.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={selectAll}>
                                        {selectedStudentIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredStudents.length > 0 ? (
                                <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                                    <div className="divide-y divide-gray-200">
                                        {filteredStudents.map((student) => {
                                            const isSelected = selectedStudentIds.has(student.id);
                                            return (
                                                <label
                                                    key={student.id}
                                                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-slate-50' : ''
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleStudent(student.id)}
                                                        className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{getStudentName(student)}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {student.studentId || student.bFormCrc || 'No ID'} • {getClassName(student.classApplyingFor)} • {getSectionName(student.sectionId)}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-500">
                                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-sm">No students found</p>
                                    <p className="text-xs mt-1">Try adjusting your filters</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}
