import React, { useState } from "react";
import { useForm } from "react-hook-form";
import IconBtn from "../../../../common/IconBtn";
import { GrAddCircle } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { BiRightArrow } from "react-icons/bi";
import { setStep, setCourse, setEditCourse } from "../../../../../slices/courseSlice";
import { createSection, updateSection } from "../../../../../services/operations/courseDetailsAPI";
import toast from "react-hot-toast";
import NestedView from "./NestedView";
import { MdNavigateNext } from "react-icons/md";

const CourseBuilderForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [editSectionName, setEditSectionName] = useState(null);
  const { course } = useSelector((state) => state.course);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    let result;

    if (editSectionName) {
      //if we are editing the section
      result = await updateSection(
        {
          sectionName: data.sectionName,
          sectionId: editSectionName,
          courseId: course._id,
        },token
      );
    } else {
      //else we will create the section
      result = await createSection(
        {
          sectionName: data.sectionName,
          courseId: course._id,
        },token
      );
    }

    //update the values on the valid results
    if (result) {
      dispatch(setCourse(result));
      setEditSectionName(null); //edit waala kaam ho chuka hai toh use null mark kr do
      setValue("sectionName", "");
    }

    //loading false
    setLoading(false);
  };

  const cancelEdit = () => {
    setEditSectionName(null); //setSection name ko null krdo
    setValue("sectionName", ""); //form hai isliye empty bhi krdo
  };

  const goBack = () => {
    dispatch(setStep(1)); //set Step to 1
    dispatch(setEditCourse(true)); //edit course ko true krdo as we will edit course now
  };

  const goToNext = () => {
    if (course?.courseContent?.length === 0) {
      toast.error("Please add atleast one Section");
      return;
    }
    if (
      course.courseContent.some((section) => section.subSection.length === 0)
    ) {
      //agar subSection nhi hai toh at least ek daal do
      toast.error("Please add at least one lecture in each section");
      return;
    }
    //if everything is good next step pr chale jao
    dispatch(setStep(3));
  };

  const handleChangeEditSectionName = (sectionId, sectionName) => {
    if (editSectionName === sectionId) {
      //agar editSectionName mein pehle se hi yahi id hai toh ab toggle krna hoga action ko
      cancelEdit();
      return;
    }
    setEditSectionName(sectionId);
    setValue("sectionName", sectionName);
  };

  return (
    <div className="space-y-8 rounded-md  border-[1px] border-richblack-700 bg-richblack-800 p-6">
      <p className="text-2xl font-semibold text-richblack-5">Course Builder</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="sectionName"
          className="text-sm text-richblack-5"
          >
            Section Name <sup className="text-pink-200">*</sup>
          </label>
          <input
            id="sectionName"
            placeholder="Add Section Name"
            {...register("sectionName", { required: true })}
            className="form-style w-full"
          />
          {errors.sectionName && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              Section Name is required
            </span>
            )}
        </div>

        {/* button to create section */}
        <div className="flex items-end gap-x-4">
          <IconBtn
            type="Submit"
            text={editSectionName ? "Edit Section Name" : "Create Section"}
            outline={true}
          >
            <GrAddCircle size={20} className="text-yellow-50" />
          </IconBtn>
          {/* edit section mein uske saath cancel waala bhi button hoga */}
          {editSectionName && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-richblack-300 underline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Nested View Create karo */}
      {course?.courseContent?.length > 0 && ( //nested view tabhi render hoga when kch course mein hoga
        <NestedView handleChangeEditSectionName={handleChangeEditSectionName} />
      )}

      <div className="flex justify-end gap-x-3">
        <button
          onClick={goBack}
          className={`flex cursor-pointer items-center gap-x-2 rounded-md bg-richblack-300 py-[8px] px-[20px] font-semibold text-richblack-900`}
        >
          Back
        </button>
        <IconBtn text="Next" onclick={goToNext} disabled={loading}>
          <MdNavigateNext />
        </IconBtn>
      </div>
    </div>
  );
};

export default CourseBuilderForm;
