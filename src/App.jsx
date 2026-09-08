import { createContext, useContext, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from "./components/molecules/Navbar/Navbar"
import Footer from "./components/organism/Footer/FooterComponent"
import Banner from './components/organism/Banner/Banner'
import Home from "./components/Pages/Home";
import CourseDetail from "./components/Pages/CourseDetail";
import ForParents from "./components/Pages/ForParents";
import About from "./components/Pages/About";
import PlacementsPage from "./components/Pages/PlacementsPage";
import Contact from "./components/Pages/Contact";
import FAQ from "./components/Pages/FAQ";
import Blog from "./components/Pages/Blog";
import BlogPost from "./components/Pages/BlogPost";
import ScrollToTop from "./components/ScrollToTop";
import PortalRoute from "./components/portal/PortalRoute";
import PortalLogin from "./components/portal/PortalLogin";
import PortalHome from "./components/portal/PortalHome";
import PortalCourse from "./components/portal/PortalCourse";
import Modal from 'react-modal';
import EnquiryForm from './components/forms/Enquiry Form/EnquiryForm';
import EnrollForm from './components/forms/EnrollForm/EnrollForm';
import "./App.css"
import FloatingIcons from './components/molecules/Floating Icons Components/FloatingIcons';
import { ToastContainer, toast } from 'react-toastify';
 let AuthContext=createContext(null)
 Modal.setAppElement('#root');

function App() {
  // The portal is an app surface, not a page of the marketing site (#110, #111).
  // The navbar, the floating WhatsApp/call buttons and the site footer all
  // render outside <Routes>, so without this they sit on top of the student
  // home — and inside the Capacitor shell (#109) a "call us" bubble over a
  // logged-in student's timetable makes no sense at all.
  const isPortal = useLocation().pathname.startsWith("/portal");

  const [modalIsOpen, setIsOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState(null);
  // Which course the enquiry was opened from, so the form can say so and the
  // lead arrives with the course attached. `null` when opened from the navbar
  // or anywhere else that isn't about one course in particular.
  const [enquiryCourse, setEnquiryCourse] = useState(null);

  let openModal=(course)=> {
    // Guards against a click handler being passed straight in as `onClick`,
    // which would otherwise put a SyntheticEvent in here.
    setEnquiryCourse(typeof course === "string" ? course : course?.name || null);
    setIsOpen(true);
  }

  let closeModal=()=> {
    setIsOpen(false);
    setEnquiryCourse(null);
  }

  // Enrolment modal — opened per course (paid → checkout, else → register).
  let openEnroll=(course)=> {
    setEnrollCourse(course);
  }
  let closeEnroll=()=> {
    setEnrollCourse(null);
  }

  const notify = (message) => toast(message);

  const customStyles = {
    overlay:{
      backgroundColor:"var(--rca-scrim)",
      backdropFilter:"blur(3px)",
    },
    // content: {
    //   top: '55%',
    //   left: '50%',
    //   right: 'auto',
    //   bottom: 'auto',
    //   marginRight: '-50%',
    //   transform: 'translate(-50%, -50%)',
    // },
  };
  
  

  return (
    <AuthContext.Provider className="app" value={{ openModal, closeModal, openEnroll, closeEnroll, notify, enquiryCourse }}>
      {!isPortal && <Navbar />}
      <ToastContainer className={"toast"} autoClose={2500}/>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="modal-enquiry-form"
        style={customStyles}

      >
        <EnquiryForm course={enquiryCourse} />
      </Modal>
      <Modal
        isOpen={!!enrollCourse}
        onRequestClose={closeEnroll}
        className="modal-enquiry-form"
        style={customStyles}
      >
        {enrollCourse && <EnrollForm course={enrollCourse} />}
      </Modal>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/for-parents" element={<ForParents />} />
        <Route path="/about" element={<About />} />
        <Route path="/placements" element={<PlacementsPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        {/* Student portal (#110, #111). The login screen is public; everything
            else under /portal goes through the guard, which reads /auth/me. */}
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route
          path="/portal"
          element={
            <PortalRoute>
              {({ user, logout }) => <PortalHome user={user} logout={logout} />}
            </PortalRoute>
          }
        />
        {/* One course and its lessons (#137). Behind the same guard, so a
            direct link from outside lands on login and returns here after. */}
        <Route
          path="/portal/courses/:slug"
          element={
            <PortalRoute>
              <PortalCourse />
            </PortalRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isPortal && <FloatingIcons/>}
      {!isPortal && <Footer />}
    </AuthContext.Provider>
  );
}


export let useAuth=()=>
{
  return useContext(AuthContext)
}

export default App



// import React from 'react'
// import Slider from 'react-slick';
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// function App() {
//   const settings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 3, // Initial number of slides shown
//     slidesToScroll: 1,
//     responsive: [
//       {
//         breakpoint: 1024, // Adjust breakpoint as needed
//         settings: {
//           slidesToShow: 2,
//           slidesToScroll: 1,
//           infinite: true,
//           dots: true
//         }
//       },
//       {
//         breakpoint: 600, // Adjust breakpoint as needed
//         settings: {
//           slidesToShow: 1,
//           slidesToScroll: 1
//         }
//       }
//     ]
//   };

//   return (
//     <div className="responsive-slider-container" style={{border:"5px solid red",width:"80rem"}}> {/* Add a container for styling */}
//       <Slider {...settings}>
//         <div>
//           <img src="https://bootstrapmade.com/content/demo/Selecao/assets/img/testimonials/testimonials-3.jpg" alt="" />
//           <h3>Slide 1</h3>
//           <p>Content for slide 1.</p>
//         </div>
//         <div>
//         <img src="https://bootstrapmade.com/content/demo/Selecao/assets/img/testimonials/testimonials-1.jpg" alt="" />

//           <h3>Slide 2</h3>
//           <p>Content for slide 2.</p>
//         </div>
//         <div>
//         <img src="https://bootstrapmade.com/content/demo/Selecao/assets/img/testimonials/testimonials-2.jpg" alt="" />

//           <h3>Slide 3</h3>
//           <p>Content for slide 3.</p>
//         </div>
//         <div>
//           <h3>Slide 4</h3>
//           <p>Content for slide 4.</p>
//         </div>
//         <div>
//           <h3>Slide 5</h3>
//           <p>Content for slide 5.</p>
//         </div>
//         {/* Add more slides as needed */}
//       </Slider>
//     </div>
//   );
// }

// export default App
