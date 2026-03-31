'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Check } from 'lucide-react';
import { UserPermission } from '@/types';

interface PermissionSelectorProps {
    permissions: UserPermission[];
    onChange: (permissions: UserPermission[]) => void;
}

const MODULE_LABELS: Record<string, string> = {
    SCHOOL_DETAILS: 'School Details',
    ADMINS: 'Admins',
    POLICIES: 'Policies',
    ACADEMICS: 'Academics',
    ADMISSION: 'Admission',
    STUDENTS: 'Students',
    STAFF: 'Staff',
    FEE: 'Fee',
    SALARY: 'Salary',
    ATTENDANCE: 'Attendance',
    ACCOUNTING: 'Accounting',
    ANNOUNCEMENTS: 'Announcements',
    APP_ACCESS: 'App Access',
};

const PermissionSelector: React.FC<PermissionSelectorProps> = ({ permissions, onChange }) => {
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const toggleModule = (module: string) => {
        setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }));
    };

    const handleActionToggle = (module: string, action: keyof Omit<UserPermission, 'module' | 'id' | 'userId'>) => {
        const newPermissions = permissions.map(p => {
            if (p.module === module) {
                return { ...p, [action]: !p[action] };
            }
            return p;
        });
        onChange(newPermissions);
    };

    const handleSelectAllModule = (module: string, selectAll: boolean) => {
        const newPermissions = permissions.map(p => {
            if (p.module === module) {
                return {
                    ...p,
                    canView: selectAll,
                    canCreate: selectAll,
                    canUpdate: selectAll,
                    canDelete: selectAll,
                };
            }
            return p;
        });
        onChange(newPermissions);
    };

    const isModuleFullAccess = (p: UserPermission) => p.canView && p.canCreate && p.canUpdate && p.canDelete;

    // Ensure all modules are represented even if they aren't in the permissions list yet
    const sortedPermissions = [...permissions].sort((a, b) =>
        (MODULE_LABELS[a.module] || a.module).localeCompare(MODULE_LABELS[b.module] || b.module)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold tracking-tight">Role-Based Permissions</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Grant specific module access and actions for this administrator.
            </p>

            <div className="border border-gray-200 rounded-xl bg-card overflow-hidden">
                {sortedPermissions.map((p) => {
                    const isExpanded = expandedModules[p.module];
                    const fullAccess = isModuleFullAccess(p);

                    return (
                        <div key={p.module} className="border-b border-gray-200 last:border-b-0">
                            <div
                                className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => toggleModule(p.module)}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="flex items-center justify-center w-6 h-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAllModule(p.module, !fullAccess);
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border border-gray-200 flex items-center justify-center transition-all ${fullAccess ? 'bg-primary border-primary scale-110' : 'bg-white border-gray-300'}`}>
                                            {fullAccess && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                    <span className="font-semibold text-sm md:text-base text-gray-700">{MODULE_LABELS[p.module] || p.module}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden lg:flex gap-2 mr-2">
                                        {p.canView && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-100 font-bold uppercase tracking-wider">View</span>}
                                        {p.canCreate && <span className="px-2 py-0.5 bg-slate-50 text-slate-800 text-[10px] rounded border border-slate-100 font-bold uppercase tracking-wider">Create</span>}
                                        {p.canUpdate && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded border border-amber-100 font-bold uppercase tracking-wider">Update</span>}
                                        {p.canDelete && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] rounded border border-rose-100 font-bold uppercase tracking-wider">Delete</span>}
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-4 bg-white grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-gray-50">
                                    {[
                                        { key: 'canView', label: 'View' },
                                        { key: 'canCreate', label: 'Create' },
                                        { key: 'canUpdate', label: 'Update' },
                                        { key: 'canDelete', label: 'Delete' }
                                    ].map((action) => {
                                        const isChecked = (p as any)[action.key];
                                        return (
                                            <label key={action.key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isChecked ? 'bg-primary/5 border-primary/20' : 'bg-gray-50/50 border-gray-100 hover:border-primary/20 hover:bg-white'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-offset-0"
                                                    checked={isChecked}
                                                    onChange={() => handleActionToggle(p.module, action.key as any)}
                                                />
                                                <span className={`text-sm font-semibold ${isChecked ? 'text-primary' : 'text-gray-600'}`}>{action.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PermissionSelector;
