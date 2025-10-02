"use client"
import { supabase } from '@/services/supabase'
import { useUser } from '@clerk/nextjs'
import { SquareArrowOutUpRight } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react'

function Library() {

    const { user } = useUser();
    const [libraryHistory, setLibraryHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    
    useEffect(() => {
        GetLibraryHistroy();
    }, [user])

    const GetLibraryHistroy = async () => {
        setLoading(true);
        
        const userEmail = user?.primaryEmailAddress?.emailAddress || 'guest@example.com';
        
        let { data: Library, error } = await supabase
            .from('Library')
            .select('*, Chats(*)')
            .eq('userEmail', userEmail)
            .order('id', { ascending: false })
        
        if (error) {
            console.error('Error fetching library:', error);
            setLoading(false);
            return;
        }
        
        // Sort Chats by created_at for each Library item
        const sortedLibrary = Library?.map(item => ({
            ...item,
            Chats: item.Chats?.sort((a, b) => 
                new Date(a.created_at) - new Date(b.created_at)
            ) || []
        })) || [];
        
        setLibraryHistory(sortedLibrary);
        setLoading(false);
    }
    
    const handleDelete = async (itemId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this conversation?')) return;
        
        const { error } = await supabase
            .from('Library')
            .delete()
            .eq('id', itemId);
        
        if (error) {
            console.error('Error deleting conversation:', error);
            return;
        }
        
        await GetLibraryHistroy();
    };

    const groupedConversations = useMemo(() => {
        const now = moment();
        const filtered = libraryHistory.filter(item => 
            (item?.searchInput || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = {
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: []
        };

        filtered.forEach(item => {
            const createdAt = moment(item.created_at);
            const diffDays = now.diff(createdAt, 'days');

            if (diffDays === 0) groups.today.push(item);
            else if (diffDays === 1) groups.yesterday.push(item);
            else if (diffDays <= 7) groups.lastWeek.push(item);
            else if (diffDays <= 30) groups.lastMonth.push(item);
            else groups.older.push(item);
        });

        return groups;
    }, [libraryHistory, searchQuery]);

    const hasConversations = libraryHistory.length > 0;

    return (
        <div className='mt-20 px-6 md:px-12 lg:px-24 xl:px-40 pb-10'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='font-bold text-3xl text-gray-800'>Library</h1>
                <p className='text-gray-500 mt-1'>View and manage your conversation history</p>

                {hasConversations && (
                    <div className='mt-6'>
                        <input
                            type='text'
                            placeholder='Search conversations...'
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {loading ? (
                    <div className='mt-8 space-y-4'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='bg-white rounded-lg border border-gray-200 p-5 animate-pulse'>
                                <div className='h-5 bg-gray-200 rounded w-3/4'></div>
                                <div className='h-4 bg-gray-200 rounded w-1/2 mt-3'></div>
                            </div>
                        ))}
                    </div>
                ) : !hasConversations ? (
                    <div className='mt-16 text-center'>
                        <div className='bg-gray-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center'>
                            <SquareArrowOutUpRight className='h-12 w-12 text-gray-400' />
                        </div>
                        <h3 className='mt-6 font-semibold text-xl text-gray-700'>No conversations yet</h3>
                        <p className='mt-2 text-gray-500'>Start a new search to create your first conversation</p>
                        <button
                            onClick={() => router.push('/')}
                            className='mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
                        >
                            Start Searching
                        </button>
                    </div>
                ) : (
                    <div className='mt-8 space-y-8'>
                        {Object.entries(groupedConversations).map(([key, items]) => {
                            if (items.length === 0) return null;
                            
                            const titles = {
                                today: 'Today',
                                yesterday: 'Yesterday',
                                lastWeek: 'Last 7 days',
                                lastMonth: 'Last 30 days',
                                older: 'Older'
                            };

                            return (
                                <div key={key}>
                                    <h2 className='font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3'>
                                        {titles[key]}
                                    </h2>
                                    <div className='space-y-3'>
                                        {items.map((item) => {
                                            const messageCount = item.Chats?.length || 0;
                                            const latestChat = item.Chats?.[item.Chats.length - 1];
                                            const preview = latestChat?.aiResp?.substring(0, 150) || 'No messages yet';

                                            return (
                                                <div
                                                    key={item.id}
                                                    className='bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition cursor-pointer group'
                                                    onClick={() => router.push('/search/' + item.libId)}
                                                >
                                                    <div className='flex justify-between items-start gap-4'>
                                                        <div className='flex-1 min-w-0'>
                                                            <div className='flex items-center gap-2 mb-2'>
                                                                <h3 className='font-semibold text-gray-800 truncate'>
                                                                    {item?.searchInput || 'Untitled Conversation'}
                                                                </h3>
                                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                                    item.type === 'research' 
                                                                        ? 'bg-purple-100 text-purple-700' 
                                                                        : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                    {item.type}
                                                                </span>
                                                            </div>
                                                            <p className='text-sm text-gray-500 line-clamp-2 mb-2'>
                                                                {preview.replace(/\[(\d+)\]/g, '')}...
                                                            </p>
                                                            <div className='flex items-center gap-4 text-xs text-gray-400'>
                                                                <span>{messageCount} {messageCount === 1 ? 'message' : 'messages'}</span>
                                                                <span>•</span>
                                                                <span>{moment(item.created_at).fromNow()}</span>
                                                            </div>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <button
                                                                onClick={(e) => handleDelete(item.id, e)}
                                                                className='opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition'
                                                                title='Delete conversation'
                                                            >
                                                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                                                </svg>
                                                            </button>
                                                            <SquareArrowOutUpRight className='h-4 w-4 text-gray-400 group-hover:text-blue-600 transition' />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Library