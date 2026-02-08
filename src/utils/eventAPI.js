import API from "./api";

export const getEventsAPI = async (lat, lon, radius) => {
  const params = { lat, lon, radius };
  const res = await API.get("/events", { params });
  return res.data;
};

export const getEventAPI = async (id) => {
  const res = await API.get(`/event/${id}`);
  return res.data;
};

export const toggleInterestedAPI = async (id) => {
  const res = await API.patch(`/event/${id}/interested`);
  return res.data;
};

export const toggleGoingAPI = async (id) => {
  const res = await API.patch(`/event/${id}/going`);
  return res.data;
};
