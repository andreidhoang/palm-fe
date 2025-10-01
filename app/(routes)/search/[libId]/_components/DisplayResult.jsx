import { Loader2Icon, LucideImage, LucideList, LucideSparkles, LucideVideo, Send } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react'
import AnswerDisplay from './AnswerDisplay';
import axios from 'axios';
import { SEARCH_RESULT } from '@/services/Shared';
import { supabase } from '@/services/supabase';
import { useParams } from 'next/navigation';
import ImageListTab from './ImageListTab';
import SourceList from './SourceList';
import SourceListTab from './SourceListTab';
import { Button } from '@/components/ui/button';
const tabs = [
    { label: 'Answer', icon: LucideSparkles },
    { label: 'Images', icon: LucideImage },
    // { label: 'Videos', icon: LucideVideo },
    { label: 'Sources', icon: LucideList, badge: 10 },
];


function DisplayResult({ searchInputRecord }) {

    const [activeTab, setActiveTab] = useState('Answer')
    const [searchResult, setSearchResult] = useState(searchInputRecord);
    const { libId } = useParams();
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [userInput, setUserInput] = useState();
    const streamAbortControllerRef = useRef(null);
    
    useEffect(() => {
        // Update this method
        searchInputRecord?.Chats?.length == 0 ? GetSearchApiResult() : GetSearchRecords();
        setSearchResult(searchInputRecord)
        console.log(searchInputRecord);
    }, [searchInputRecord])

    // Cleanup streaming on unmount
    useEffect(() => {
        return () => {
            if (streamAbortControllerRef.current) {
                streamAbortControllerRef.current.abort();
            }
        };
    }, [])

    const GetSearchApiResult = async () => {
        setLoadingSearch(true);
        const result = await axios.post('/api/brave-search-api', {
            searchInput: userInput ?? searchInputRecord?.searchInput,
            searchType: searchInputRecord?.type ?? 'Search'
        });
        console.log(result.data);
        const searchResp = result.data;
        //Save to DB
        const formattedSearchResp = searchResp?.web?.results?.map((item, index) => (
            {
                title: item?.title,
                description: item?.description,
                long_name: item?.profile?.long_name,
                img: item?.profile?.img,
                url: item?.url,
                thumbnail: item?.thumbnail?.src,
                original: item?.thumbnail?.original
            }
        ))
        console.log(formattedSearchResp);
        // Fetch Latest From DB

        const { data, error } = await supabase
            .from('Chats')
            .insert([
                {
                    libId: libId,
                    searchResult: formattedSearchResp,
                    userSearchInput: searchInputRecord?.searchInput
                },
            ])
            .select()
        setUserInput('')
        await GetSearchRecords();
        setLoadingSearch(false);
        await GenerateAIResp(formattedSearchResp, data[0].id)
        // Pass to LLM Model
    }

    const GenerateAIResp = async (formattedSearchResp, recordId) => {
        // Cancel any previous streaming request
        if (streamAbortControllerRef.current) {
            streamAbortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        streamAbortControllerRef.current = abortController;

        try {
            const response = await fetch('/api/llm-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchInput: searchInputRecord?.searchInput,
                    searchResult: formattedSearchResp,
                    recordId: recordId
                }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                console.error('Streaming API error:', response.statusText);
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split by \n\n to get complete SSE events
                    const events = buffer.split('\n\n');
                    // Keep the last incomplete event in the buffer
                    buffer = events.pop() || '';

                    for (const event of events) {
                        if (event.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(event.slice(6));
                                
                                if (data.text) {
                                    accumulatedText += data.text;
                                    // Update the chat by recordId to avoid race conditions
                                    setSearchResult(prev => {
                                        if (!prev?.Chats || prev.Chats.length === 0) return prev;
                                        const updatedChats = prev.Chats.map(chat => 
                                            chat.id === recordId 
                                                ? { ...chat, aiResp: accumulatedText }
                                                : chat
                                        );
                                        return {
                                            ...prev,
                                            Chats: updatedChats
                                        };
                                    });
                                }
                                
                                if (data.done) {
                                    console.log('Streaming complete!');
                                }
                                
                                if (data.error) {
                                    console.error('Streaming error:', data.error);
                                }
                            } catch (parseError) {
                                console.error('Error parsing SSE event:', parseError);
                            }
                        }
                    }
                }
            } finally {
                reader.cancel();
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Streaming cancelled');
            } else {
                console.error('Error generating AI response:', error);
            }
        } finally {
            if (streamAbortControllerRef.current === abortController) {
                streamAbortControllerRef.current = null;
            }
        }
    }

    const GetSearchRecords = async () => {
        let { data: Library, error } = await supabase
            .from('Library')
            .select('*,Chats(*)')
            .eq('libId', libId)
            .order('id', { foreignTable: 'Chats', ascending: true })

            ;
        if (error) {
            console.error('Error fetching library records:', error);
            return;
        }
        if (Library && Library.length > 0) {
            setSearchResult(Library[0])
        } else {
            console.warn('No library record found for libId:', libId);
        }
    }

    return (
        <div className='mt-7 flex flex-wrap'>
            {!searchResult?.Chats &&
                <div>
                    <div className='w-full h-5 bg-accent animate-pulse rounded-md'></div>
                    <div className='w-1/2 mt-2 h-5 bg-accent animate-pulse rounded-md'></div>
                    <div className='w-[70%] mt-2 h-5 bg-accent animate-pulse rounded-md'></div>

                </div>}
            {searchResult?.Chats && searchResult.Chats.length > 0 && (() => {
                // Only show the most recent chat
                const chat = searchResult.Chats[searchResult.Chats.length - 1];
                return (
                    <div className='mt-7'>
                        <h2 className='font-bold text-4xl text-gray-600'>{chat?.userSearchInput || searchResult?.searchInput}</h2>
                        <div className="flex items-center space-x-6 border-b border-gray-200 pb-2 mt-6">
                            {tabs.map(({ label, icon: Icon, badge }) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveTab(label)}
                                    className={`flex items-center gap-1 relative text-sm font-medium text-gray-700 hover:text-black ${activeTab === label ? 'text-black' : ''
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
                                    {badge && (
                                        <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                            {badge}
                                        </span>
                                    )}
                                    {activeTab === label && (
                                        <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded"></span>
                                    )}
                                </button>
                            ))}
                            <div className="ml-auto text-sm text-gray-500">
                                1 task <span className="ml-1">↗</span>
                            </div>
                        </div>

                        <div>
                            {activeTab == 'Answer' ?
                                <AnswerDisplay chat={chat} loadingSearch={loadingSearch} /> :
                                activeTab == 'Images' ? <ImageListTab chat={chat} />
                                    : activeTab == 'Sources' ?
                                        <SourceListTab chat={chat} /> : null
                            }
                        </div>
                        <hr className='my-5' />

                    </div>
                );
            })()}
            <div className='h-[200px]'>
            </div>
            <div className='bg-white w-full border rounded-lg 
            shadow-md p-3 px-5 flex justify-between fixed bottom-6 max-w-md lg:max-w-xl xl:max-w-3xl'>
                <input placeholder='Type Anything...' className='outline-none w-full'
                    onChange={(e) => setUserInput(e.target.value)} value={userInput}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            GetSearchApiResult(); // replace this with your actual function
                        }
                    }} />
                {userInput && <Button onClick={GetSearchApiResult} disabled={loadingSearch}>
                    {loadingSearch ? <Loader2Icon className='animate-spin' /> : <Send />}</Button>}
            </div>
        </div>
    )
}

export default DisplayResult