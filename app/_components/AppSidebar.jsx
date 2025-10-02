"use client"
import React, { useEffect, useState } from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from 'next/image'
import { Compass, GalleryHorizontalEnd, LogIn, MessageSquare, Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignOutButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { supabase } from '@/services/supabase'
import moment from 'moment'

const MenuOptions = [
    {
        title: 'Home',
        icon: Search,
        path: '/#'
    },
    {
        title: 'Discover',
        icon: Compass,
        path: '/discover'
    },
    {
        title: 'Library',
        icon: GalleryHorizontalEnd,
        path: '/library'
    },

]
function AppSidebar() {
    const path = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const [recentConversations, setRecentConversations] = useState([]);

    useEffect(() => {
        if (user) {
            fetchRecentConversations();
        }
    }, [user]);

    const fetchRecentConversations = async () => {
        const userEmail = user?.primaryEmailAddress?.emailAddress || 'guest@example.com';
        
        const { data, error } = await supabase
            .from('Library')
            .select('*')
            .eq('userEmail', userEmail)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!error && data) {
            setRecentConversations(data);
        }
    };

    return (
        <Sidebar >
            <SidebarHeader className='bg-accent flex px-6 py-5' >
                <Image src={'/logo.png'} alt='logo' width={180} height={140} />
            </SidebarHeader>
            <SidebarContent className='bg-accent'>
                <SidebarGroup >

                    <SidebarMenu>
                        {MenuOptions.map((menu, index) => (
                            <SidebarMenuItem key={index}>
                                <SidebarMenuButton asChild
                                    className={`p-5 py-6 hover:bg-transparent hover:font-bold
                                    ${path?.includes(menu.path) && 'font-bold'}`}>
                                    <a href={menu.path} className=''>
                                        <menu.icon className='h-8 w-8' />
                                        <span className='text-lg'>{menu.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>

                    {!user ? (
                        <SignUpButton mode='modal'>
                            <Button className='rounded-full mx-4 mt-4'>Sign Up</Button>
                        </SignUpButton>
                    ) : (
                        <div className='mt-6 px-4'>
                            <div className='flex items-center gap-2 mb-3'>
                                <MessageSquare className='h-4 w-4 text-gray-600' />
                                <h3 className='text-sm font-semibold text-gray-600'>Recent Conversations</h3>
                            </div>
                            {recentConversations.length === 0 ? (
                                <p className='text-xs text-gray-400 px-2'>No conversations yet</p>
                            ) : (
                                <div className='space-y-2'>
                                    {recentConversations.map((conv) => (
                                        <div
                                            key={conv.id}
                                            onClick={() => router.push(`/search/${conv.libId}`)}
                                            className='p-2 rounded-md hover:bg-gray-100 cursor-pointer transition group'
                                        >
                                            <p className='text-sm font-medium text-gray-800 truncate group-hover:text-blue-600'>
                                                {conv?.searchInput || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 mt-0.5'>
                                                {moment(conv.created_at).fromNow()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </SidebarGroup>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter className='bg-accent'>
                <div className='p-3 flex flex-col'>
                    <h2 className='text-gray-500'>Try Now</h2>
                    <p className='text-gray-400'>Upgrade for image upload, smarter AI & more copilot</p>
                    <Button variant={'secondary'} className={'text-gray-500 mb-3'}>Learn More</Button>
                    <UserButton />
                </div>

            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar