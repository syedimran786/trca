import React from 'react'
import Banner from '../organism/Banner/Banner'
import Courses from '../organism/courses/Courses.jsx'
import Mentors from '../organism/mentors/Mentors.jsx'
import Reviews from '../organism/reviews/Reviews.jsx'
import Clients from '../organism/clients/Clients.jsx'
import Placement from '../organism/placements/Placements.jsx'
import Batches from '../organism/Batches/Batches.jsx'
import EnquiryForm from '../forms/Enquiry Form/EnquiryForm.jsx'


function Home() {
  return (
    <section>
        <Banner/>
        <Courses/>
        {/* <Mentors/> */}
        <Reviews/>
        <Clients/>
        <Batches/>
        <Placement/>

       
    </section>
  )
}

export default Home
