"use client"
import { AshardTabs } from "@/components/ui/AshardTabs";
import { SettingsTabs } from "@/components/ui/SettingsTabs";
import { useState } from "react";
import { BiWorld } from "react-icons/bi";
import { GrConfigure, GrDeploy } from "react-icons/gr";

const DeploymentLayout = ({ children }: { children: React.ReactNode }) => {

    const [activeTab, setActiveTab] = useState<'overview' | 'configuration'>('overview');

    const DeploymentTabs = [
        {
            id: 'overview',
            label: 'Overview',
            href: '/dashboard/deployments',
            icon: <GrDeploy size={18} />,
        },
        {
            id: 'configuration',
            label: 'Configuration',
            href: '/dashboard/deployments/configuration',
            icon: <GrConfigure size={18} />,
        },
        {
            id: 'environment',
            label: 'Environment',
            href: '/dashboard/deployments/environments',
            icon: <BiWorld size={18} />,
        }
    ];

    const handleTabChange = (id: string) => setActiveTab(id as 'overview' | 'configuration');


    return (
        <div className="  animate-in fade-in slide-in-from-bottom-2 duration-500 selection:bg-blue-100 h-full p-4 md:p-8">
            <SettingsTabs items={DeploymentTabs} className="mb-4 w-fit" />
            {children}
        </div>
    )
}

export default DeploymentLayout