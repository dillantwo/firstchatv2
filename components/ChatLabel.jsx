import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContextLTI'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import axios from 'axios'
import Image from 'next/image'
import React from 'react'
import toast from 'react-hot-toast'

const ChatLabel = ({openMenu, setOpenMenu, id, name}) => {

  const {fetchUsersChats, chats, setSelectedChat, selectedChat} = useAppContext()
  const { isDark } = useTheme()
  const { t } = useLanguage()

  const selectChat = ()=>{
    const chatData = chats.find(chat => chat._id === id)
    setSelectedChat(chatData)
  }
  const renameHandler = async ()=>{
    try {
      const newName = prompt(t('Enter new name'))
      if(!newName) return 
      const {data} = await axios.post('/api/chat/rename', {chatId: id, name: newName})
      if(data.success){
        fetchUsersChats()
        setOpenMenu({id: 0, open: false})
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteHandler = async () =>{
    try {
      const confirm = window.confirm('Are you sure you want to delete this chat?')
      if(!confirm) return
      const {data} = await axios.post('/api/chat/delete', {chatId: id })
      if (data.success){
        fetchUsersChats()
        setOpenMenu({ id: 0, open: false })
        toast.success(data.message)
      }
      else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div onClick={selectChat} className={`flex items-center justify-between p-2 ${isDark ? 'text-white/80 hover:bg-white/10' : 'text-gray-800 hover:bg-gray-200'} rounded-lg text-sm group cursor-pointer ${selectedChat?._id === id ? (isDark ? 'bg-white/10' : 'bg-gray-200') : ''}`}>
      <p className='group-hover:max-w-4/6 truncate flex-1 min-w-0'>{name}</p>
      <div onClick={e=>{e.stopPropagation();setOpenMenu({id: id, open: !openMenu.open})}}
       className={`group relative flex items-center justify-center h-6 w-6 aspect-square ${isDark ? 'hover:bg-black/80' : 'hover:bg-gray-300'} rounded-lg flex-shrink-0`}>
        <Image src={assets.three_dots} alt='' className={`w-4 ${openMenu.id === id && openMenu.open ? '' : 'hidden'} group-hover:block`}/>
        <div className={`absolute ${openMenu.id === id && openMenu.open ? 'block' : 'hidden'} -right-2 top-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-xl w-max p-2 z-[9999] shadow-lg border`}>
            <div onClick={renameHandler} className={`flex items-center gap-3 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg whitespace-nowrap`}>
                <Image src={assets.pencil_icon} alt='' className='w-4'/>
                <p>{t('Rename')}</p>
            </div>
            <div onClick={deleteHandler} className={`flex items-center gap-3 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg whitespace-nowrap`}>
                <Image src={assets.delete_icon} alt='' className='w-4'/>
                <p>{t('Delete')}</p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default ChatLabel
