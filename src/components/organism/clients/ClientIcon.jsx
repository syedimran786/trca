import React from 'react'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { Rating } from '@mui/material';

function ReviewIcon({value}) {
  return (
    <>
     <Rating name="half-rating" defaultValue={value} precision={0.5} size="small" readOnly />
    </>
  )
}

export default ReviewIcon
