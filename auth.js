const axios = require("axios").default;
const fs = require("fs");
require("dotenv").config();

async function auth() {
  try {
    const options = {
      method: "POST",
      url: `${process.env.URL}/api/token`,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        Origin: `${process.env.URL}`,
      },
      data: {
        emailAddress: `${process.env.SCHOOL_EMAIL}`,
        password: `${process.env.SCHOOL_PASSWORD}`,
      },
    };
    const {
      data: { token },
    } = await axios.request(options);
    await fs.promises.writeFile("token.txt", token);
    console.log("Token saved to token.txt.");
  } catch (error) {
    console.error("Error: School API authentication error:", error);
    throw error;
  }
}

auth();
