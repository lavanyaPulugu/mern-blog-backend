const Post = require("../models/postModel");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/errorModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

//****************** create a post */
// POST : api/posts
//protected

const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(
        new HttpError("Fill in all fields and choose thumbnail.", 422)
      );
    }
    const { thumbnail } = req.files;
    //check the file size
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("Thumbnail too big. file should be less theb 2MB")
      );
    }
    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFilename,
            creator: req.user.id,
          });
          if (!newPost) {
            return next(new HttpError("post couldn't be created.", 422));
          }
          //fine userand increate post count by 1
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

//****************** get all posts */
// POST : api/posts
//protected

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//****************** get single posts */
// get : api/posts/:id
//protected

const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post noy found.", 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//****************** get post by category*/
//get : api/posts/categories/:category
//unprotected

const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//****************** get author post */
// get: api/posts/users.:id
//unprotected

const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//****************** edit post */
// patch: api/posts/:id
//protected

const editPost = async (req, res, next) => {
  try {
    let fileName;
    let newFilename;
    let updatedPost;
    const postId = req.params.id;
    let { title, category, description } = req.body;
    if (!title || !category || description.length < 12) {
      return next(new HttpError("fill in all fields", 422));
    }
    //get old post from database
    const oldPost = await Post.findById(postId);
    if (req.user.id == oldPost.creator) {
      if (!req.files) {
        updatedPost = await Post.findByIdAndUpdate(
          postId,
          { title, category, description },
          { new: true }
        );
      } else {
        fs.unlink(
          path.join(__dirname, "..", "uploads", oldPost.thumbnail),
          async (err) => {
            if (err) {
              return next(new HttpError(err));
            }
          }
        );

        //update new thumbnail
        const { thumbnail } = req.files;
        //check file size
        if (thumbnail.size > 2000000) {
          return next(
            new HttpError("Thumbnail too big. file should be less theb 2MB")
          );
        }
        fileName = thumbnail.name;
        let splittedFilename = fileName.split(".");
        newFilename =
          splittedFilename[0] +
          uuid() +
          "." +
          splittedFilename[splittedFilename.length - 1];
        splittedFilename[splittedFilename.length - 1];
        thumbnail.mv(
          path.join(__dirname, "..", "/uploads", newFilename),
          async (err) => {
            if (err) {
              return next(new HttpError(err));
            }
          }
        );
        updatedPost = await Post.findByIdAndUpdate(
          postId,
          { title, category, description, thumbnail: newFilename },
          { new: true }
        );
      }
    }

    if (!updatedPost) {
      return next(new HttpError("couldn't update post.", 400));
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//****************** delete post */
// delete: api/posts/:id
//protected

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return next(new HttpError("post unavailable.", 400));
    }
    const post = await Post.findById(postId);
    const fileName = post?.thumbnail;
    if (req.user.id == post.creator) {
      //delete thumbnail from uploads folder
      fs.unlink(
        path.join(__dirname, "..", "uploads", fileName),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          } else {
            await Post.findByIdAndDelete(postId);
            //find user and reduse post count by1
            const currentUser = await User.findById(req.user.id);
            const userPostCount = currentUser?.posts - 1;
            await User.findByIdAndUpdate(req.user.id, {
              posts: userPostCount,
            });
          }
        }
      );
      res.json(`Post ${postId} deleted successfully`);
    } else {
      return next(new HttpError("post couldn't be deleted", 403));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPost,
  getPosts,
  getCatPosts,
  getUserPosts,
  editPost,
  deletePost,
};
