import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaTimes } from "react-icons/fa";
import Auth from '../pages/Auth';

function AuthModel({ onClose }) {
    const { userData } = useSelector((state) => state.user)
    const navigate = useNavigate()

    const handleClose = () => {
        onClose()
        navigate('/')
    }

    useEffect(() => {
        if (userData) {
            onClose()
        }

    }, [userData, onClose])

    return (
        <div className='fixed inset-0 z-[999] flex items-center justify-center bg-black/10 backdrop-blur-sm px-4'>
            <div className='relative w-full max-w-md'>
                <button
                    type='button'
                    onClick={handleClose}
                    aria-label='Close'
                    className='absolute top-8 right-5 z-20 cursor-pointer text-gray-500 hover:text-[#1D4ED8] hover:rotate-90 transition-all duration-300 text-xl'>
                    <FaTimes size={18} />
                </button>
                <Auth isModel={true} />
            </div>
        </div>
    )
}

export default AuthModel