import React, { Suspense } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
const SiteLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <div className='flex flex-col h-full w-full'>
      <Suspense fallback={<div aria-hidden="true" className="h-[72px] w-full bg-white" />}>
        <Header />
      </Suspense>
      {children}
      <Footer />
    </div>
  )
}

export default SiteLayout