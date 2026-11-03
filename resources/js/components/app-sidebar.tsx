import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BriefcaseBusiness, ExternalLink, FileText, Github, Inbox, LayoutDashboard, MonitorCheck, Receipt, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Messages', url: '/dashboard/messages', icon: Inbox },
    { title: 'Clients', url: '/dashboard/clients', icon: Users },
    { title: 'Projects', url: '/dashboard/projects', icon: BriefcaseBusiness },
    { title: 'Invoices', url: '/dashboard/invoices', icon: FileText },
    { title: 'Expenses', url: '/dashboard/expenses', icon: Receipt },
    { title: 'Client previews', url: '/dashboard/previews', icon: MonitorCheck },
];

const footerNavItems: NavItem[] = [
    {
        title: 'View site',
        url: '/',
        icon: ExternalLink,
    },
    {
        title: 'Code on GitHub',
        url: 'https://github.com/timwerema/portfolio',
        icon: Github,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
