import API from "../utils/api";

// Admin Statistics APIs
export const getTotalUsers = async () => {
  try {
    const res = await API.get("/admin/get_total_users");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getOnlineUsers = async () => {
  try {
    const res = await API.get("/admin/get_online_users");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getTotalPosts = async () => {
  try {
    const res = await API.get("/admin/get_total_posts");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getTotalComments = async () => {
  try {
    const res = await API.get("/admin/get_total_comments");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getTotalLikes = async () => {
  try {
    const res = await API.get("/admin/get_total_likes");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getTotalSpamPosts = async () => {
  try {
    const res = await API.get("/admin/get_total_spam_posts");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Admin Moderation APIs
export const getSpamPosts = async () => {
  try {
    const res = await API.get("/admin/get_spam_posts");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const deleteSpamPost = async (postId) => {
  try {
    const res = await API.delete(`/admin/delete_spam_posts/${postId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Get all users (using new admin API)
export const getAllUsers = async () => {
  try {
    const res = await API.get("/admin/get_all_users");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Get all posts (using new admin API)
export const getAllPosts = async () => {
  try {
    const res = await API.get("/admin/get_all_posts");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
