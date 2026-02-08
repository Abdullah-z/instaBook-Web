import API from "../utils/api";

export const shareLocationAPI = async (
  lat,
  lon,
  visibility,
  type,
  duration,
) => {
  const response = await API.post("/location/share", {
    latitude: lat,
    longitude: lon,
    visibility,
    type,
    duration,
  });
  return response.data;
};

export const getSharedLocationsAPI = async (
  lat,
  lon,
  radius = 50,
  limit,
  skip,
  typeFilter,
  audienceFilter,
) => {
  const params = {
    latitude: lat,
    longitude: lon,
    radius,
  };

  if (limit) params.limit = limit;
  if (skip) params.skip = skip;
  if (typeFilter) params.typeFilter = typeFilter;
  if (audienceFilter) params.audienceFilter = audienceFilter;

  const response = await API.get("/location/shared", { params });
  return response.data;
};

export const stopSharingAPI = async () => {
  const response = await API.delete("/location/share");
  return response.data;
};

export const createShoutoutAPI = async (lat, lon, content, visibility) => {
  const response = await API.post("/location/shoutout", {
    latitude: lat,
    longitude: lon,
    content,
    visibility,
  });
  return response.data;
};
