import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContextLTI'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import axios from 'axios'
import Image from 'next/image'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

const ChatLabel = ({openMenu, setOpenMenu, id, name}) => {

  const {fetchUsersChats, chats, setSelectedChat, selectedChat} = useAppContext()
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const selectChat = ()=>{
    const chatData = chats.find(chat => chat._id === id)
    setSelectedChat(chatData)
  }

  const openRenameDialog = () => {
    setNewName(name)
    setShowRenameDialog(true)
    setOpenMenu({id: 0, open: false})
  }

  const renameHandler = async ()=>{
    try {
      if(!newName.trim()) {
        toast.error(t('Name cannot be empty'))
        return
      }
      const {data} = await axios.post('/api/chat/rename', {chatId: id, name: newName.trim()})
      if(data.success){
        fetchUsersChats()
        setShowRenameDialog(false)
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const cancelRename = () => {
    setShowRenameDialog(false)
    setNewName('')
  }

  const deleteHandler = async () =>{
    try {
      const {data} = await axios.post('/api/chat/delete', {chatId: id })
      if (data.success){
        fetchUsersChats()
        setOpenMenu({ id: 0, open: false })
        setShowDeleteDialog(false)
        toast.success(data.message)
      }
      else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openDeleteDialog = () => {
    setShowDeleteDialog(true)
    setOpenMenu({id: 0, open: false})
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div onClick={selectChat} className={`flex items-center justify-between p-2 ${isDark ? 'text-white/80 hover:bg-white/10' : 'text-gray-800 hover:bg-gray-200'} rounded-lg text-sm group cursor-pointer select-none ${selectedChat?._id === id ? (isDark ? 'bg-white/10' : 'bg-gray-200') : ''}`}>
        <p className='group-hover:max-w-4/6 truncate flex-1 min-w-0 select-none'>{name}</p>
        <div onClick={e=>{e.stopPropagation();setOpenMenu({id: id, open: !openMenu.open})}}
         className={`group relative flex items-center justify-center h-6 w-6 aspect-square ${isDark ? 'hover:bg-black/80' : 'hover:bg-gray-300'} rounded-lg flex-shrink-0`}>
          <Image src={assets.three_dots} alt='' className={`w-4 ${openMenu.id === id && openMenu.open ? '' : 'hidden'} group-hover:block touch-device-visible`}/>
          <div className={`absolute ${openMenu.id === id && openMenu.open ? 'block' : 'hidden'} -right-2 top-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-xl w-max p-2 z-[9999] shadow-lg border`}>
              <div onClick={openRenameDialog} className={`flex items-center gap-3 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg whitespace-nowrap`}>
                  <Image src={assets.pencil_icon} alt='' className='w-4'/>
                  <p>{t('Rename')}</p>
              </div>
              <div onClick={openDeleteDialog} className={`flex items-center gap-3 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg whitespace-nowrap`}>
                  <Image src={assets.delete_icon} alt='' className='w-4'/>
                  <p>{t('Delete')}</p>
              </div>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={cancelRename}>
          <div 
            className={`${isDark ? 'bg-[#2a2b2f] border-gray-600/30' : 'bg-white border-gray-200'} border rounded-lg p-6 w-80 max-w-sm mx-4 shadow-xl`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium mb-4`}>
              {t('Rename Chat')}
            </h3>
            
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={t('Enter new name')}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  renameHandler()
                } else if (e.key === 'Escape') {
                  cancelRename()
                }
              }}
            />
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelRename}
                className={`px-4 py-2 rounded-md ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} transition-colors`}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={renameHandler}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {t('Rename')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={cancelDelete}>
          <div 
            className={`${isDark ? 'bg-[#2a2b2f] border-gray-600/30' : 'bg-white border-gray-200'} border rounded-lg p-6 w-80 max-w-sm mx-4 shadow-xl`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium mb-4`}>
              {t('Delete Chat')}
            </h3>
            
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
              {t('Are you sure you want to delete this chat? This action cannot be undone.')}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className={`px-4 py-2 rounded-md ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} transition-colors`}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={deleteHandler}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                {t('Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatLabel
