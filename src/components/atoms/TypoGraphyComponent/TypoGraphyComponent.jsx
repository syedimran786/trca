import { Typography } from '@mui/material'
import React from 'react'

//! variant=h1,h2,h3,h4,h5,h6,subtitle1,subtitle2,body1,body2,button,caption,overline
//! helper classes we can use like mt,mb,gutturBottom etc
''
function TypoGraphyComponent({variant="caption",component="p",children="",text="",sx={},className=""}) {
  return (
    <Typography className={className} variant={variant} component={component} sx={{...sx,visibility:text==="syllabus"?"hidden":"visible"}}>{children?children:text}</Typography>
  )
}

export default TypoGraphyComponent
