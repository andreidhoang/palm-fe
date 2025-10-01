import Image from 'next/image'
import React from 'react'

function ImageListTab({ chat }) {
    const images = chat?.images || [];
    
    return (
        <div className='flex gap-5 flex-wrap mt-6'>
            {images.length > 0 ? (
                images.map((item, index) => (
                    <img src={item?.original} alt={item?.title || 'Image'}
                        width={200}
                        height={200}
                        key={index}
                        onClick={() => window.open(item.original, '_blank')}
                        className='bg-accent rounded-xl object-contain w-[200px] h-full cursor-pointer'
                    />
                ))
            ) : (
                <div className='text-gray-500 text-sm mt-4'>No images available</div>
            )}
        </div>
    )
}

export default ImageListTab