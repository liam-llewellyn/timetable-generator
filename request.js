const axios = require("axios").default;
const fs = require("fs");
require("dotenv").config();

const auth = require("./auth");

module.exports = async function makeRequest(userEmail) {
  try {
    const token = await fs.promises.readFile("token.txt", "utf8");
    const options = {
      method: "GET",
      url: `${process.env.URL}/api/timetable/${userEmail}`,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        Authorization: `Bearer ${token}`,
        Connection: "keep-alive",
      },
    };
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("API Request error:", error);
    if (error.response && error.response.status === 401) {
      auth();
    }
    throw error;
  }
};
