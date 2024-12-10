import React, { useEffect, useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { Autoplay, FreeMode, Pagination, Navigation } from "swiper/modules";
import ReactStars from "react-rating-stars-component";
import { apiConnector } from "../../services/apiconnector";
import { ratingsEndpoints } from "../../services/apis";
import { FaStar } from "react-icons/fa";

const ReviewSlider = () => {
  const [reviews, setReviews] = useState([]);
  const truncateWords = 15; //starting ke 15 words hi dikhaane hai

  useEffect(() => {
    const fetchAllReviews = async () => {
      const { data } = await apiConnector(
        "GET",
        ratingsEndpoints.REVIEWS_DETAILS_API
      );
      console.log("Logging Response in Rating", data);

      if (data?.success) {
        setReviews(data?.data);
      }
      console.log("Printing Reviews", reviews);
    };
    fetchAllReviews();
  }, []);

  return (
    <div className="text-white">
      <div className="my-[50px] h-[184px] max-w-maxContentTab lg:max-w-maxContent">
        <Swiper
          slidesPerView={4}
          spaceBetween={24}
          loop={true}
          freeMode={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          modules={[FreeMode, Pagination, Autoplay]}
          className="w-full"
        >
          {/* //saare reviews ke liye maps ka use krlo */}
          {reviews.map((review, index) => (
            <SwiperSlide key={index}>
              <div className="flex flex-col gap-3 bg-richblack-800 text-[14px] text-richblack-25">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      review?.user?.image
                        ? review?.user?.image
                        : `https://api.dicebear.com/5.x/initials/svg?sedd=${review?.user?.firstName} ${review?.user?.lastName}`
                    }
                    alt="Profile Pic"
                    className="h-9 w-9 object-cover rounded-full"
                  />
                  <div className="flex flex-col">
                    <h1 className="font-semibold text-richblack-5">
                      {`${review?.user?.firstName} ${review?.user?.lastName}`}
                    </h1>
                    <h2 className="text-[12px] font-medium text-richblack-500">
                      {review?.course?.courseName}
                    </h2>
                  </div>
                </div>
                <p className="font-medium text-richblack-25">
                  {review?.review.split(" ").length > truncateWords
                    ? `${review?.review
                        .split(" ")
                        .slice(0, truncateWords)
                        .join(" ")} ...`
                    : `${review?.review}`}
                </p>
                <div className="flex items-center gap-2 ">
                    <h3 className="font-semibold text-yellow-100">
                      {review.rating.toFixed(1)}
                    </h3>
                    <ReactStars
                      count={5}
                      value={review.rating}
                      size={20}
                      edit={false}
                      activeColor="#ffd700"
                      emptyIcon={<FaStar />}
                      fullIcon={<FaStar />}
                    />
                  </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ReviewSlider;
