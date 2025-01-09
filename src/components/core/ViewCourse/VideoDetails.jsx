import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI";
import { BigPlayButton, Player } from "video-react";
import { updateCompletedLectures } from "../../../slices/viewCourseSlice";
import { AiFillPlayCircle } from "react-icons/ai";
import IconBtn from "../../common/IconBtn";

const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const playerRef = useRef();
  const { token } = useSelector((state) => state.auth);
  const { courseSectionData, courseEntireData, completedLectures } =
    useSelector((state) => state.viewCourse);

  const [videoData, setVideoData] = useState([]);
  const [previewSource, setPreviewSource] = useState("");
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setVideoSpecificDetails = async () => {
      if (!courseSectionData.length) return;
      if (!courseId && !sectionId && !subSectionId) {
        navigate("/dashboard/enrolled-courses");
      } else {
        //lets assume ki all 3 fields are present
        const filteredData = courseSectionData.filter(
          (course) => course._id === sectionId
        );

        const filteredVideoData = filteredData?.[0].subSection.filter(
          (data) => data._id === subSectionId
        );

        setVideoData(filteredVideoData[0]);
        setVideoEnded(false);
      }
    };
    setVideoSpecificDetails();
  }, [courseSectionData, courseEntireData, location.pathname]);

  const isFirstVideo = () => {
    //current Section ka index nikaal lo
    const currentSectionIndex = courseSectionData.findIndex(
      (data) => data._id === sectionId
    );

    //current subSection ka index nikaal lo
    const currentSubSectionIndex = courseSectionData[
      currentSectionIndex
    ].subSection.findIndex((data) => data._id === subSectionId);

    if (currentSectionIndex === 0 && currentSubSectionIndex === 0) {
      //mtlb first video hai
      return true;
    } else {
      return false;
    }
  };

  const isLastVideo = () => {
    //current Section ka index nikaal lo
    const currentSectionIndex = courseSectionData.findIndex(
      (data) => data._id === sectionId
    );

    //number of subSections bhi nikaal lo
    const noofSubSections =
      courseSectionData[currentSectionIndex].subSection.length;
    //current subSection ka index nikaal lo
    const currentSubSectionIndex = courseSectionData[
      currentSectionIndex
    ].subSection.findIndex((data) => data._id === subSectionId);

    if (
      currentSectionIndex === courseSectionData.length - 1 &&
      currentSubSectionIndex === noofSubSections - 1 //agr n-1th section kki m-1th video hao toh woh last video hai
    ) {
      return true;
    } else {
      return false;
    }
  };

  const goToNextVideo = () => {
    //current Section ka index nikaal lo
    const currentSectionIndex = courseSectionData.findIndex(
      (data) => data._id === sectionId
    );

    //number of subSections bhi nikaal lo
    const noofSubSections =
      courseSectionData[currentSectionIndex].subSection.length;
    //current subSection ka index nikaal lo
    const currentSubSectionIndex = courseSectionData[
      currentSectionIndex
    ].subSection.findIndex((data) => data._id === subSectionId);

    if (currentSubSectionIndex !== noofSubSections - 1) {
      //same section ki next video mein jao
      const nextSubSectionId =
      courseSectionData[currentSectionIndex].subSection[
        currentSubSectionIndex + 1
      ]._id
      //next video pr jao
      navigate(
        `/view-course/${courseId}/section/${sectionId}/sub-section/${nextSubSectionId}`
      );
    } else {
      //different section ki first video pr jao
      const nextSectionId = courseSectionData[currentSectionIndex + 1]._id;
      const nextSubSectionId =
        courseSectionData[currentSectionIndex + 1].subSection[0]._id;
      //is waali video pr jao
      navigate(
        `/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubSectionId}`
      );
    }
  };

  const goToPrevVideo = () => {
    //current Section ka index nikaal lo
    const currentSectionIndex = courseSectionData.findIndex(
      (data) => data._id === sectionId
    );

    //number of subSections bhi nikaal lo
    const noofSubSections =
      courseSectionData[currentSectionIndex].subSection.length;
    //current subSection ka index nikaal lo
    const currentSubSectionIndex = courseSectionData[
      currentSectionIndex
    ].subSection.findIndex((data) => data._id === subSectionId);

    if (currentSubSectionIndex !== 0) {
      //agar current video first video nhi hai
      // //same section ki previous video
      const prevSubSectionId =
        courseSectionData[currentSectionIndex].subSection[
          currentSectionIndex - 1
        ]._id;
      //is video pr chale jao
      navigate(
        `/view-course/${courseId}/section/${sectionId}/sub-section/${prevSubSectionId}`
      );
    } else {
      //different section, last video
      const prevSectionId = courseSectionData[currentSectionIndex - 1]._id;
      const prevSubSectionLength =
        courseSectionData[currentSectionIndex - 1].subSection.length;
      const prevSubSectionId =
        courseSectionData[currentSectionIndex - 1].subSection[
          prevSubSectionLength - 1
        ]._id;
      //iss video pr chale jao
      navigate(
        `/view-course/${courseId}/section/${prevSectionId}/sub-section/${prevSubSectionId}`
      );
    }
  };

  const handleLectureCompletion = async () => {
    setLoading(true)
    const res = await markLectureAsComplete(
      { courseId: courseId, subsectionId: subSectionId },
      token
    )
    //state update krdo
    if (res) {
      dispatch(updateCompletedLectures(subSectionId))
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-5 text-white">
      {!videoData ? (
        <img
          src={previewSource}
          alt="Preview"
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <Player
          ref={playerRef}
          aspectRatio="16:9"
          playsInline
          onEnded={() => setVideoEnded(true)}
          src={videoData?.videoUrl}
        >
          <BigPlayButton position="center" />
          {
            //agar video end ho jaaye toh uska logic likh do
            videoEnded && (
              <div
                style={{
                backgroundImage:
                  "linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.1)",
              }}
              className="full absolute inset-0 z-[100] grid h-full place-content-center font-inter"  
              >
                {!completedLectures.includes(subSectionId) && (
                <IconBtn
                  disabled={loading}
                  onclick={() => handleLectureCompletion()}
                  text={!loading ? "Mark As Completed" : "Loading..."}
                  customClasses="text-xl max-w-max px-4 mx-auto"
                />
              )}

                <IconBtn
                  disabled={loading}
                  onclick={() => {
                    //jab bhi DOM mein kch change krna ho toh laways use useRef() react hook
                    if (playerRef?.current) {
                      //rewatch krne ke liye player ki current condition ko 0 pr seek krdoo
                      playerRef.current?.seek(0);
                      setVideoEnded(false);
                    }
                  }}
                  text="Rewatch"
                  customClasses="text-xl max-w-max px-4 mx-auto mt-2"
                />

                {/* prev ans next ka button bhi daal do */}
                <div className="mt-10 flex min-w-[250px] justify-center gap-x-4 text-xl">
                  {
                    //first video pr prev ka button nhi aana chahiye baaki mein dikha do
                    !isFirstVideo() && (
                      <button
                        disabled={loading}
                        onClick={goToPrevVideo}
                        className="blackButton"
                      >
                        Prev
                      </button>
                    )
                  }
                  {
                    //last video pr next ka button nhi aana chahiye baaki mein dikha do
                    !isLastVideo() && (
                      <button
                        disabled={loading}
                        onClick={goToNextVideo}
                        className="blackButton"
                      >
                        Next
                      </button>
                    )
                  }
                </div>
              </div>
            )
          }
        </Player>
      )}
      <h1 className="mt-4 text-3xl font-semibold">{videoData?.title}</h1>
      <p className="pt-2 pb-6">{videoData?.description}</p>
    </div>
  );
};

export default VideoDetails;
