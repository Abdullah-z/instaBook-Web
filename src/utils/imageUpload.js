export const checkImage = (file) => {
  let err = "";
  if (!file) return (err = "File does not exist.");
  if (file.size > 10 * 1024 * 1024)
    return (err = "File size must be less than 10 Mb.");
  return err;
};

export const imageUpload = async (images) => {
  let imgArr = [];
  for (const item of images) {
    const formData = new FormData();
    formData.append("file", item);
    formData.append("upload_preset", "dprkhzls");
    formData.append("cloud_name", "dcxgup2xo");

    const resourceType = item.type?.startsWith("video") ? "video" : "image";

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dcxgup2xo/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    imgArr.push({
      public_id: data.public_id,
      url: data.secure_url,
      resource_type: resourceType,
    });
  }
  return imgArr;
};
