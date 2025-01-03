const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: [isEmail, "Please provide a valid email"],
      unique: true, // Ensure email uniqueness
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [9, "Password must be more than 8 characters"],
      validate: [
        {
          validator: function (value) {
            return (
              /[A-Z]/.test(value) &&
              /\d/.test(value) &&
              /[!@#$%^&*(),.?":{}|<>]/.test(value)
            );
          },
          message:
            "Password must contain at least one uppercase letter, one number, and one special character",
        },
      ],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user"],
        message: "{VALUE} is not a valid role.",
      },
      default: "user",
    },
    interests: {
      type: [String],
      enum: {
        values: [
          "Machine Learning",
          "Robotics",
          "Natural Language Processing (NLP)",
          "Cognitive Computing",
          "AI in Gaming",
        ],
        message: "{VALUE} is not a valid interest.",
      },
      required: true,
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isPasswordMatch = await bcrypt.compare(
    candidatePassword,
    this.password
  );
  return isPasswordMatch;
};

module.exports = mongoose.model("User", UserSchema);