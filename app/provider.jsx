"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'

function Provider({ children }) {

    const { user } = useUser();
    const [userDetail, setUserDetail] = useState();
    useEffect(() => {
        user && CreateNewUser();
    }, [user])

    const CreateNewUser = async () => {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase is not configured. Skipping user creation.');
            return;
        }

        try {
            //If user already exist?
            let { data: Users, error } = await supabase
                .from('Users')
                .select('*')
                .eq('email', user?.primaryEmailAddress.emailAddress);

            if (error) {
                console.error('Error fetching user:', error);
                return;
            }

            console.log(Users)
            if (Users.length == 0) {
                const { data, error } = await supabase
                    .from('Users')
                    .insert([
                        {
                            name: user?.fullName,
                            email: user?.primaryEmailAddress.emailAddress
                        },
                    ])
                    .select();
                if (error) {
                    console.error('Error creating user:', error);
                    return;
                }
                setUserDetail(data[0]);
                return;
            }

            setUserDetail(Users[0]);
        } catch (error) {
            console.error('Unexpected error in CreateNewUser:', error);
        }
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <div className='w-full '>{children}</div>
        </UserDetailContext.Provider>
    )
}

export default Provider