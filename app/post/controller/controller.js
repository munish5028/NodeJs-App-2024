const multer = require('multer');
const path = require('path');
const POST = require('../model/model');

const storage = multer.diskStorage({
  destination: './uploads/img',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).fields([{ name: 'img', maxCount: 10 }]);

const add = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!req.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const data = req.body;
      data.createBy = req.userId;

      if (req.files && req.files.img) {
        data.images = req.files.img.map((file) => file.path);
      }

      const savePost = await POST.aggregate([
        {
          $addFields: {
            createBy: req.userId,
          },
        },
        {
          $merge: {
            into: 'users',
            on: '_id',
            as: 'createBy',
          },
        },
      ]);

      const savedPost = await savePost[0];
      res.status(200).json(savedPost);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const posts = await POST.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createBy',
          foreignField: '_id',
          as: 'createBy',
        },
      },
      {
        $unwind: '$createBy',
      },
      {
        $project: {
          _id: 1,
          title: 1,
          desc: 1,
          images: 1,
          createBy: {
            _id: '$createBy._id',
            email: '$createBy.email',
          },
        },
      },
      {
        $sort: { createdAt: -1 }, // sort by creation date (newest first)
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const count = await POST.countDocuments();
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ posts, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const edit = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const postId = req.params.id;
      const post = await POST.aggregate([
        {
          $match: {
            _id: postId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createBy',
            foreignField: '_id',
            as: 'createBy',
          },
        },
        {
          $unwind: '$createBy',
        },
      ]);

      if (!post[0]) {
        return res.status(404).json({ message: 'Post not found' });
      }
      if (post[0].createBy._id.toString() !== req.userId) {
        return res.status(403).json({ message: 'You are not authorized to edit this post' });
      }

      const data = req.body;

      if (req.files && req.files.img) {
        data.images = req.files.img.map((file) => file.path);
      }

      const updatedPost = await POST.findByIdAndUpdate(postId, data, { new: true });
      res.status(200).json(updatedPost);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const remove = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await POST.aggregate([
      {
        $match: {
          _id: postId,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createBy',
          foreignField: '_id',
          as: 'createBy',
        },
      },
      {
        $unwind: '$createBy',
      },
    ]);

    if (!post[0]) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post[0].createBy._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }
    await POST.findByIdAndRemove(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { add, list, edit, remove };