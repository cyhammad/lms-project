'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, CheckCircle2, AlertCircle, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useStudents } from '@/hooks/use-students';
import { useClasses } from '@/hooks/use-classes';
import { useSessions } from '@/hooks/use-sessions';
import { ROUTES } from '@/constants/routes';
import { getStudentsByClass, demoteStudents } from '@/lib/student-storage';

interface DemoteStudentsClientProps {
    user: any;
}

export default function DemoteStudentsClient({ user }: DemoteStudentsClientProps) {
    const router = useRouter();
    const { students, refresh } = useStudents();
    const { classes } = useClasses();
    const { sessions } = useSessions();
    const [loading, setLoading] = useState(false);
    const [sourceClassId, setSourceClassId] = useState('');
    const [sourceAcademicSession, setSourceAcademicSession] = useState('');
    const [targetClassId, setTargetClassId] = useState('');
    const [targetAcademicSession, setTargetAcademicSession] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [demoteAll, setDemoteAll] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [demotionResult, setDemotionResult] = useState<{ demoted: number; failed: number } | null>(null);
    const [demoteConfirmOpen, setDemoteConfirmOpen] = useState(false);

    const schoolClasses = user?.schoolId
        ? classes.filter(c => c.schoolId === user.schoolId && c.isActive).sort((a, b) => a.grade - b.grade)
        : [];

    const availableSessions = sessions.filter(s =>
        user?.schoolId ? s.schoolId === user.schoolId : true
    );

    const sourceClassStudents = useMemo(() => {
        if (!sourceClassId || !sourceAcademicSession) return [];
        let filtered = getStudentsByClass(sourceClassId).filter(s =>
            user?.schoolId ? s.schoolId === user.schoolId : true
        );

        // Filter by source academic session
        filtered = filtered.filter(s => s.academicSession === sourceAcademicSession);

        return filtered;
    }, [sourceClassId, sourceAcademicSession, user?.schoolId]);

    // Get classes that have students in the selected source session
    const sourceSessionClasses = useMemo(() => {
        if (!sourceAcademicSession) return [];

        // Filter students by school and active status
        const allStudents = students.filter(s => {
            const schoolMatch = user?.schoolId ? s.schoolId === user.schoolId : true;
            return schoolMatch && s.isActive;
        });

        // Filter students by academic session (case-insensitive, trim whitespace)
        const studentsInSession = allStudents.filter(s => {
            const studentSession = s.academicSession?.trim();
            const selectedSession = sourceAcademicSession.trim();
            return studentSession && studentSession === selectedSession;
        });

        // Extract unique class IDs from students (check both classId and classApplyingFor)
        const classIds = new Set<string>();
        studentsInSession.forEach(s => {
            if (s.classId) classIds.add(s.classId);
            if (s.classApplyingFor) classIds.add(s.classApplyingFor);
        });

        // Return classes that match the extracted class IDs
        return schoolClasses.filter(cls => classIds.has(cls.id));
    }, [sourceAcademicSession, students, user?.schoolId, schoolClasses]);

    // Get all classes for target (target class can be empty - no students required)
    const targetSessionClasses = useMemo(() => {
        // Return all active classes for the school (target can be empty)
        return schoolClasses;
    }, [schoolClasses]);

    // Auto-set target session when source changes
    useEffect(() => {
        if (sourceAcademicSession && !targetAcademicSession) {
            setTargetAcademicSession(sourceAcademicSession);
        }
    }, [sourceAcademicSession, targetAcademicSession]);

    // Reset class when session changes
    useEffect(() => {
        if (sourceAcademicSession) {
            setSourceClassId('');
            setSelectedStudentIds(new Set());
            setDemoteAll(true);
        }
    }, [sourceAcademicSession]);

    useEffect(() => {
        if (targetAcademicSession) {
            // Reset target class when session changes
            setTargetClassId('');
        }
    }, [targetAcademicSession]);

    useEffect(() => {
        if (demoteAll && sourceClassStudents.length > 0) {
            setSelectedStudentIds(new Set(sourceClassStudents.map(s => s.id)));
        } else {
            setSelectedStudentIds(new Set());
        }
    }, [demoteAll, sourceClassStudents]);

    const toggleStudentSelection = (studentId: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setSelectedStudentIds(newSet);
        setDemoteAll(false);
    };

    const getClassName = (classId: string) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.name} (${cls.code}) - Grade ${cls.grade}` : 'Unknown Class';
    };

    const getStudentName = (student: any) => {
        return student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!sourceAcademicSession) {
            newErrors.sourceAcademicSession = 'Please select source academic session first';
        }
        if (!sourceClassId) {
            newErrors.sourceClassId = 'Please select source class';
        }
        if (!targetAcademicSession) {
            newErrors.targetAcademicSession = 'Please select target academic session first';
        }
        if (!targetClassId) {
            newErrors.targetClassId = 'Please select target class';
        }
        if (sourceClassId === targetClassId && sourceAcademicSession === targetAcademicSession) {
            newErrors.targetClassId = 'Target must be different from source (class or session)';
        }
        if (selectedStudentIds.size === 0) {
            newErrors.students = 'Please select at least one student to demote';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDemote = () => {
        if (!validateForm()) {
            return;
        }
        setDemoteConfirmOpen(true);
    };

    const doDemote = async () => {
        setDemoteConfirmOpen(false);
        setLoading(true);
        setDemotionResult(null);

        try {
            const result = demoteStudents(
                Array.from(selectedStudentIds),
                targetClassId,
                targetAcademicSession
            );

            setDemotionResult(result);

            if (result.demoted > 0) {
                refresh();
                // Reset form after successful demotion
                setTimeout(() => {
                    setSourceClassId('');
                    setSourceAcademicSession('');
                    setTargetClassId('');
                    setTargetAcademicSession('');
                    setSelectedStudentIds(new Set());
                    setDemoteAll(true);
                    setDemotionResult(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Error demoting students:', error);
            alert('Failed to demote students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
                        <p className="text-sm font-medium text-gray-700">Demoting students...</p>
                    </div>
                </div>
            )}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Demote Students</h1>
                <p className="text-gray-600 mt-1">Move students from one class to another</p>
            </div>

            {demotionResult && (
                <Card className={demotionResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            {demotionResult.failed === 0 ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {demotionResult.demoted} student(s) demoted successfully
                                </p>
                                {demotionResult.failed > 0 && (
                                    <p className="text-sm text-amber-700 mt-1">
                                        {demotionResult.failed} student(s) could not be demoted
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Class Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Source Class</CardTitle>
                        <CardDescription>Select the current class of students</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="sourceAcademicSession" className="block text-sm font-medium text-gray-700 mb-1">
                                Source Academic Session *
                            </label>
                            <select
                                id="sourceAcademicSession"
                                value={sourceAcademicSession}
                                onChange={(e) => {
                                    setSourceAcademicSession(e.target.value);
                                    setSourceClassId('');
                                    setSelectedStudentIds(new Set());
                                    setDemoteAll(true);
                                    if (errors.sourceAcademicSession) setErrors({ ...errors, sourceAcademicSession: '' });
                                }}
                                disabled={loading}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent ${errors.sourceAcademicSession ? 'border-red-500' : 'border-gray-300'
                                    } ${loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                            >
                                <option value="">Select source session</option>
                                {availableSessions.map((session) => (
                                    <option key={session.id} value={session.name}>
                                        {session.name}
                                    </option>
                                ))}
                            </select>
                            {errors.sourceAcademicSession && <p className="text-sm text-red-500 mt-1">{errors.sourceAcademicSession}</p>}
                        </div>

                        {sourceAcademicSession && (
                            <div>
                                <label htmlFor="sourceClassId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Class *
                                </label>
                                <select
                                    id="sourceClassId"
                                    value={sourceClassId}
                                    onChange={(e) => {
                                        setSourceClassId(e.target.value);
                                        setSelectedStudentIds(new Set());
                                        setDemoteAll(true);
                                        if (errors.sourceClassId) setErrors({ ...errors, sourceClassId: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent ${errors.sourceClassId ? 'border-red-500' : 'border-gray-300'
                                        } ${loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                    disabled={sourceSessionClasses.length === 0 || loading}
                                >
                                    <option value="">
                                        {sourceSessionClasses.length > 0
                                            ? 'Select source class'
                                            : 'No classes found with students in this session'}
                                    </option>
                                    {sourceSessionClasses.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.code}) - Grade {cls.grade}
                                        </option>
                                    ))}
                                </select>
                                {errors.sourceClassId && <p className="text-sm text-red-500 mt-1">{errors.sourceClassId}</p>}
                                {sourceAcademicSession && sourceSessionClasses.length === 0 && (
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs text-amber-800">
                                            No active students found in any class for session "{sourceAcademicSession}".
                                            Please check that students have this session assigned.
                                        </p>
                                    </div>
                                )}
                                {sourceAcademicSession && sourceSessionClasses.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Found {sourceSessionClasses.length} class{sourceSessionClasses.length !== 1 ? 'es' : ''} with students in this session
                                    </p>
                                )}
                            </div>
                        )}

                        {sourceClassId && sourceClassStudents.length > 0 && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">
                                        {sourceClassStudents.length} student(s) found
                                    </span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    {getClassName(sourceClassId)}
                                </p>
                            </div>
                        )}

                        {sourceClassId && sourceAcademicSession && sourceClassStudents.length === 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    No active students found in this class for session "{sourceAcademicSession}".
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Target Class Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Target Class</CardTitle>
                        <CardDescription>Select the new class for demotion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="targetAcademicSession" className="block text-sm font-medium text-gray-700 mb-1">
                                Target Academic Session *
                            </label>
                            <select
                                id="targetAcademicSession"
                                value={targetAcademicSession}
                                onChange={(e) => {
                                    setTargetAcademicSession(e.target.value);
                                    if (errors.targetAcademicSession) setErrors({ ...errors, targetAcademicSession: '' });
                                }}
                                disabled={loading}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent ${errors.targetAcademicSession ? 'border-red-500' : 'border-gray-300'
                                    } ${loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                            >
                                <option value="">Select target session</option>
                                {availableSessions.map((session) => (
                                    <option key={session.id} value={session.name}>
                                        {session.name}
                                    </option>
                                ))}
                            </select>
                            {errors.targetAcademicSession && <p className="text-sm text-red-500 mt-1">{errors.targetAcademicSession}</p>}
                        </div>

                        {targetAcademicSession && (
                            <div>
                                <label htmlFor="targetClassId" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Class *
                                </label>
                                <select
                                    id="targetClassId"
                                    value={targetClassId}
                                    onChange={(e) => {
                                        setTargetClassId(e.target.value);
                                        if (errors.targetClassId) setErrors({ ...errors, targetClassId: '' });
                                    }}
                                    disabled={loading}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent ${errors.targetClassId ? 'border-red-500' : 'border-gray-300'
                                        } ${loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                >
                                    <option value="">Select target class</option>
                                    {targetSessionClasses
                                        .filter(cls => cls.id !== sourceClassId)
                                        .map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.code}) - Grade {cls.grade}
                                            </option>
                                        ))}
                                </select>
                                {errors.targetClassId && <p className="text-sm text-red-500 mt-1">{errors.targetClassId}</p>}
                            </div>
                        )}

                        {sourceClassId && targetClassId && sourceAcademicSession && targetAcademicSession && (
                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownCircle className="w-5 h-5 text-orange-600" />
                                    <span className="font-semibold text-orange-900">Demotion Path</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-700">
                                        <span className="font-medium">From:</span> {getClassName(sourceClassId)} ({sourceAcademicSession})
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">To:</span> {getClassName(targetClassId)} ({targetAcademicSession})
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Student Selection */}
            {sourceClassId && sourceClassStudents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Students</CardTitle>
                        <CardDescription>
                            Choose which students to demote ({selectedStudentIds.size} of {sourceClassStudents.length} selected)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={demoteAll}
                                    onChange={(e) => {
                                        setDemoteAll(e.target.checked);
                                        if (e.target.checked) {
                                            setSelectedStudentIds(new Set(sourceClassStudents.map(s => s.id)));
                                        } else {
                                            setSelectedStudentIds(new Set());
                                        }
                                    }}
                                    disabled={loading}
                                    className={`w-4 h-4 text-[#f97316] border-gray-300 rounded focus:ring-[#f97316] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                <span className="text-sm font-medium text-gray-700">Select All</span>
                            </label>
                        </div>

                        {errors.students && <p className="text-sm text-red-500">{errors.students}</p>}

                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                            <div className="divide-y divide-gray-200">
                                {sourceClassStudents.map((student) => {
                                    const isSelected = selectedStudentIds.has(student.id);
                                    return (
                                        <label
                                            key={student.id}
                                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-orange-50' : ''
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleStudentSelection(student.id)}
                                                disabled={loading}
                                                className={`w-4 h-4 text-[#f97316] border-gray-300 rounded focus:ring-[#f97316] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{getStudentName(student)}</p>
                                                <p className="text-sm text-gray-500">
                                                    {student.studentId || student.bFormCrc || 'No ID'}
                                                    {student.academicSession && ` • Session: ${student.academicSession}`}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-orange-600" />
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.push(ROUTES.ADMIN.STUDENTS)}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleDemote}
                    disabled={loading || selectedStudentIds.size === 0 || !sourceClassId || !sourceAcademicSession || !targetClassId || !targetAcademicSession}
                    className="bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Demoting...
                        </>
                    ) : (
                        <>
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            Demote {selectedStudentIds.size} Student{selectedStudentIds.size !== 1 ? 's' : ''}
                        </>
                    )}
                </Button>
            </div>
            <ConfirmDialog
                open={demoteConfirmOpen}
                onConfirm={doDemote}
                onCancel={() => setDemoteConfirmOpen(false)}
                title="Demote students"
                message={`Are you sure you want to demote ${selectedStudentIds.size} student(s) from "${getClassName(sourceClassId)}" (Session: ${sourceAcademicSession}) to "${getClassName(targetClassId)}" (Session: ${targetAcademicSession})? This action will update their class assignment and academic session.`}
                confirmText="Demote"
            />
        </div>
    );
}
