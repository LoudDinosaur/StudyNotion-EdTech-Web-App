import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { courseEndpoints } from '../../../services/apis';
import { fetchInstructorCourses } from '../../../services/operations/courseDetailsAPI';
import IconBtn from '../../common/IconBtn';
import CoursesTable from './InstructorCourses/CoursesTable';
import { VscAdd } from 'react-icons/vsc';

const MyCourses = () => {

    const {token} = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);

    useEffect(() => { //first render par API call krdo
        const fetchCourses = async() => {
            const result = await fetchInstructorCourses(token);
            if(result){
                setCourses(result);
            }
        }
        fetchCourses(); //instructor ke ssare courses manga liye
    },[]);

  return (
    <div>
        <div className='mb-14 flex items-center justify-between'>
            <h1 className='text-3xl font-medium text-richblack-5'>My Courses</h1>
            <IconBtn
                text="Add Course"
                onclick={() => navigate("/dashboard/add-course")}
            >
            <VscAdd />
            </IconBtn>

        </div>


        {/*Table of courses tabhi dikhao jab course exist krte ho*/}
        {courses && <CoursesTable courses={courses} setCourses={setCourses}/>}
    </div>
  )
}

export default MyCourses