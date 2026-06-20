import { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(p => !p)
  const close  = () => setIsOpen(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
