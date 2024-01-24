const { schema, model, Schema } = require("mongoose");

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Agriculture",
        "Bussiness",
        "Education",
        "Entertainment",
        "Art",
        "Investment",
        "Uncategorized",
        "Weather",
      ],
      message: "value is not supported",
    },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("post", postSchema);
