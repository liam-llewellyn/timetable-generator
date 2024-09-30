const plist = require("plist");
const errorDisplay = document.getElementById("error-display");
const plistScaffold = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Settings</key>
    <dict>
      <key>ColorSettings</key>
      <dict></dict>
      <key>NumberOfWeeks</key>
      <integer>2</integer>
      <key>SelectedWeek</key>
      <integer>1</integer>
      <key>SelectedWeekUpdateDate</key>
      <date>2024-02-01T10:10:10Z</date>
      <key>WeekendDaysAreActive</key>
      <false/>
    </dict>
    <key>WeekEvents</key>
    <array></array>
  </dict>
</plist>`;

document
  .getElementById("timetable-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const userEmail = document.getElementById("input-field").value;
    const userPassword = document.getElementById("password-field").value;

    displayMessage(
      `Loading... If you've waited forever and the issue persists, email me.`,
      false
    );

    const token = await auth(userEmail, userPassword);
    const data = await makeRequest(userEmail, token);
    const file = await generate(data, plistScaffold);
    await download(file, "auto-generated.timetable", "application/xml");
    displayMessage(`Timetable successfully downloaded.`, false);
  });

async function auth(schoolEmail, schoolPassword) {
  try {
    const response = await fetch(
      `https://intranet.nbscmanlys-h.schools.nsw.edu.au/api/token`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          Connection: "keep-alive",
          "Content-Type": "application/json",
          Origin: `https://intranet.nbscmanlys-h.schools.nsw.edu.au`,
        },
        body: JSON.stringify({
          emailAddress: schoolEmail,
          password: schoolPassword,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Authentication failed: " + response.statusText);
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    displayMessage(
      `Error authenticating with the school's server. Check your email or password. \nResponse from server: ${error.message}`,
      true
    );
    throw error;
  }
}

async function makeRequest(userEmail, token) {
  try {
    const response = await fetch(
      `https://intranet.nbscmanlys-h.schools.nsw.edu.au/api/timetable/${userEmail}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Error fetching timetable data: " + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    displayMessage(
      `Unable to get your timetable from the school's website. Please try again later. \nResponse from server: ${error.message}`,
      true
    );
    throw error;
  }
}

async function generate(apiData, plistData) {
  try {
    const plistObject = plist.parse(plistData);
    plistObject.WeekEvents = [];

    const colorArray = [120 / 255, 120 / 255, 120 / 255];

    apiData.forEach((item) => {
      let dayNum;
      let weekNum;
      const dayNumber = parseInt(item.DayNumber, 10);

      if (dayNumber <= 5) {
        dayNum = dayNumber - 1;
        weekNum = 0;
      } else if (dayNumber >= 6 && dayNumber <= 10) {
        dayNum = dayNumber - 6;
        weekNum = 1;
      }

      const startTimeParts = item.StartTime.split(":");
      const endTimeParts = item.EndTime.split(":");
      const startTimeInSeconds =
        startTimeParts[0] * 3600 + startTimeParts[1] * 60;
      const endTimeInSeconds = endTimeParts[0] * 3600 + endTimeParts[1] * 60;

      const newPeriod = {
        dayNum,
        time: startTimeInSeconds,
        endTime: endTimeInSeconds,
        title: item.CourseName.substring(0, item.CourseName.lastIndexOf(" ")),
        info: `${item.RoomCode || "DefaultRoom"}\n${item.ClassCode}`,
        weekNum,
      };

      plistObject.WeekEvents.push(newPeriod);
      plistObject.Settings.ColorSettings[
        item.CourseName.substring(0, item.CourseName.lastIndexOf(" "))
      ] = colorArray;
    });

    return plist.build(plistObject);
  } catch (error) {
    displayMessage(
      `We got your timetable but couldn't generate the file. Please try again later. \nResponse from server: ${error.message}`,
      true
    );
    throw error;
  }
}

async function download(content, fileName, contentType) {
  try {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  } catch (error) {
    displayMessage(
      `Your file is ready but couldn't be downloaded. Please try again later. \nResponse from server: ${error.message}`,
      true
    );
    throw error;
  }
}

function displayMessage(message, isError) {
  errorDisplay.innerHTML = message;
  errorDisplay.style.color = isError ? "red" : "gray";
}
