export const checkImage = (file) => {
  let err = "";
  if (!file) return (err = "File does not exist.");
  if (file.size > 10 * 1024 * 1024)
    return (err = "File size must be less than 10 Mb.");
  return err;
};

const compressImage = (file, quality = 0.9, maxWidth = 2000) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: "image/png",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, "image/png");
      };
    };
  });
};

export const imageUpload = async (images, isHD = false) => {
  let imgArr = [];
  for (const item of images) {
    let fileToUpload = item;
    const isImage = item.type?.startsWith("image");

    if (!isHD && isImage) {
      console.log(`🖼️ Compressing image: ${item.name}...`);
      fileToUpload = await compressImage(item);
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);
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
