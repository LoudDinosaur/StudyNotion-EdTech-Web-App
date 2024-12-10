import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import copy from "copy-to-clipboard";
import { ACCOUNT_TYPE } from "../../../utils/constants";
import { addToCart } from "../../../slices/cartSlice";
import { BsFillCaretRightFill } from "react-icons/bs";
import { FaShareSquare } from "react-icons/fa";

function CourseDetailsCard({ course, setConfirmationModal, handleBuyCourse }) {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { thumbnail: ThumbnailImage, price: CurrentPrice } = course;

  const handleAddToCart = () => {
    //Instructor nhi kr skta add to cart
    if (user && user?.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
      toast.error("You are an Instructor, you can't buy a course");
      return;
    }
    //agar valid token aaya hai mtlb logged in banda aaya hai toh use krne do add to cart
    if (token) {
      console.log("Dispatching add to Cart");
      dispatch(addToCart(course));
      return;
    }

    //agar user logged in nhi hai toh confirmation modal dikhao or login page pr bhejo
    setConfirmationModal({
      text1: "You are not Logged In",
      text2: "Please Login to add to cart",
      btn1Text: "Login",
      btn2Text: "Cancel",
      btn1Handler: () => navigate("/login"),
      btn2Handler: () => setConfirmationModal(null),
    });
  };

  const handleShare = () => {
    copy(window.location.href); // to sopy the current url
    toast.success("Link Copied to Clipboard");
  };

  return (
    <>
      <div
        className={`flex flex-col gap-4 rounded-md bg-richblack-700 p-4 text-richblack-5`}
      >
        <img
          src={ThumbnailImage}
          alt="Thumbnail Image"
          className="max-h-[300px] min-h-[180px] w-[400px] overflow-hidden rounded-2xl object-cover md:max-w-full"
        />

        <div className="px-4">
          <div className="space-x-3 pb-4 text-3xl font-semibold">
            Rs. {CurrentPrice}
          </div>

          <div className="flex flex-col gap-4">
            <button
              className="yellowButton"
              onClick={
                user && course?.studentsEnrolled.includes(user?._id)
                  ? () => navigate("/dashboard/enrolled-courses")
                  : handleBuyCourse
              }
            >
              {user && course?.studentsEnrolled.includes(user?._id)
                ? "Go to Course"
                : "Buy Now"}
            </button>

            {/* //Add to cart ka logic -> jab student enrolled na ho tab add to cart dikha do */}
            {!course?.studentsEnrolled.includes(user?._id) && (
              <button onClick={handleAddToCart} className="blackButton">
                Add to Cart
              </button>
            )}
            <p className="pb-3 pt-6 text-center text-sm text-richblack-25">
              30-Day Money-Back Guatantee
            </p>
          </div>

          <div className={` `}>
            <p className={`my-2 text-xl font-semibold`}>
              This Course Includes:
            </p>
            <div className="flex flex-col gap-3 text-sm text-caribbeangreen-100">
              {
                //map ka use krke saare instructions le aao
                course?.instructions?.map((item, index) => (
                  <p key={index} className="flex gap-2">
                    <BsFillCaretRightFill />
                    <span>{item}</span>
                  </p>
                ))
              }
            </div>
          </div>

          <div>
            <button
              onClick={handleShare}
              className="mx-auto flex items-center gap-2 p-6 text-yellow-50"
            >
              <FaShareSquare size={15} /> Share
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CourseDetailsCard;
