import Image from 'next/image'
import React from 'react'

function SourceListTab({ chat }) {
    const sources = chat?.searchResult || [];
    
    return (
        <div>
            {sources.length > 0 ? (
                sources.map((item, index) => (
                    <div key={index} className='cursor-pointer hover:bg-accent p-3 rounded-lg transition'
                        onClick={() => window.open(item.url, '_blank')}>
                        <div className='flex gap-2 mt-4 items-center'>
                            <h2>{index + 1}</h2>
                            <Image src={item.img} alt={item.title}
                                width={20}
                                height={20}
                                className='rounded-full w-[20px] h-[20px] border'
                            />
                            <div>
                                <h2 className='text-xs'>{item.long_name}</h2>
                            </div>
                        </div>
                        <h2 className='mt-1 line-clamp-1 font-bold text-lg text-gray-600'>{item.title}</h2>
                        <h2 className='mt-1 text-xs text-gray-600 hover:underline'>{item.url}</h2>
                    </div>
                ))
            ) : (
                <div className='text-gray-500 text-sm mt-4'>No sources available</div>
            )}
        </div>
    )
}

export default SourceListTab