import { Box } from '@mui/material'
import React from 'react'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'

function FooterSearch() {
  let quote=`In the world of technology, persistence is more valuable than talent. Never give up on your dreams, no matter the obstacles`
  // . Your potential is limitless. Keep coding, keep learning, and never stop improving.
  return (
    <>
      
      <TypoGraphyComponent variant='h5' component='h5' text='Rest Coder Academy'/>
      <TypoGraphyComponent variant='body2' component='p' text={quote} sx={{textAlign:"justify"}}/>

      

    </>
  )
}

export default FooterSearch
