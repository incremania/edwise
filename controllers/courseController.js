const Course = require("../models/CourseModel");
const mongoose = require('mongoose')
const { extractValidationErrors } = require("../utils/handleError");


const getSingleCourse = async (req, res) => {
  try {
    const { courseId} = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "no course found"})
    }

    res.status(200).json({ status: "success", course})
  } catch (error) {
      console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find({});

    if (allCourses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    res.status(200).json({ status: "success", allCourses });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getSuggestedCoursesForUser = async (req, res) => {
  try {
    const interests = req.user.interests; 
    console.log(interests);

    if (!interests || interests.length === 0) {
      return res
        .status(400)
        .json({ message: "No interests found for the user" });
    }

    const suggestedCourses = await Course.find({
      targetAudience: { $in: interests },
    });

    res.status(200).json({ status: "success", suggestedCourses });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const createCourse = async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();

    res.status(201).json({
      status: "success",
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.log(error.message);

    const errorMessage = extractValidationErrors(error);

    res.status(400).json({
      status: "error",
      message: "Failed to create course",
      error: errorMessage,
    });
  }
};

const editCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const updatedCourse = await Course.findByIdAndUpdate(courseId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res
        .status(404)
        .json({ status: "error", message: "Course not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(400)
      .json({ status: "error", message: "Failed to update course", error });
  }
};

const addContentToCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { sectionTitle, lessons } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ status: "error", message: "Course not found" });
    }

    // Manually assign sectionNumber before adding to contents
    const newSection = {
      sectionTitle,
      lessons,
      sectionNumber: course.contents.length + 1, // Assign sectionNumber based on existing sections
    };

    // Add the new section
    course.contents.push(newSection);

    // Save the course after modifying contents
    await course.save();

    res.status(200).json({
      status: "success",
      message: "Content added successfully",
      course,
    });
  } catch (error) {
    // Handle errors
    const errorMessage = extractValidationErrors(error);

    res.status(400).json({
      status: "error",
      message: "Failed to create course",
      error: errorMessage,
    });
  }
};


const editContentInCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const contentId = req.params.contentId;
    const { sectionTitle, lessons } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ status: "error", message: "Course not found" });
    }

    const content = course.contents.id(contentId);
    if (!content) {
      return res
        .status(404)
        .json({ status: "error", message: "Content not found" });
    }

    content.sectionTitle = sectionTitle || content.sectionTitle;
    content.lessons = lessons || content.lessons;

    await course.save();

    res.status(200).json({
      status: "success",
      message: "Content updated successfully",
      course,
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(400)
      .json({ status: "error", message: "Failed to update content", error });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res
        .status(404)
        .json({ status: "error", message: "Course not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ status: "error", message: "Failed to delete course", error });
  }
};


// quiz

const addQuizToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { questions } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    for (const question of questions) {
      const correctAnswers = question.options.filter((opt) => opt.isCorrect);
      if (correctAnswers.length !== 1) {
        return res.status(400).json({
          message: `Each question must have exactly one correct answer. Issue in question: "${question.questionText}"`,
        });
      }
    }

    const quiz = { questions, _id: new mongoose.Types.ObjectId() };
    course.quizzes.push(quiz);

    await course.save();
  
    res.status(201).json({
      status: "success",
      message: "Quiz added successfully",
      quizId: quiz._id, 
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const submitQuizAnswers = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const { answers } = req.body;


    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const quiz = course.quizzes.id(quizId.toString());
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }


    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: `Answers count (${answers.length}) does not match questions count (${quiz.questions.length}).`,
      });
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
      const selectedOption = answers[index];
      if (!selectedOption) {
        console.warn(`No answer provided for question at index ${index}`);
        return; 
      }

      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption.optionText === selectedOption) {
        score++;
      }
    });

 
    const percentage = Math.ceil((score / quiz.questions.length) * 100);

    res.status(200).json({
      status: "success",
      message: "Quiz submitted successfully",
      score: percentage,
    });
  } catch (error) {
  
    res.status(500).json({ message: "Internal Server Error" });
  }
};






module.exports = {
  getSingleCourse,
  getAllCourses,
  getSuggestedCoursesForUser,
  createCourse,
  editCourse,
  addContentToCourse,
  editContentInCourse,
  deleteCourse,
  addQuizToCourse,
  submitQuizAnswers,

};
