const errorDisplay = document.getElementById("error-display");
const form = document.getElementById("timetable-form");
const submitButton = document.getElementById("submit-button");

class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = "CustomError";
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const userEmail = document.getElementById("input-field").value;
  const userPassword = document.getElementById("password-field").value;
  const queryEmail = document.getElementById("query-field").value || userEmail;

  displayMessage(
    `Loading... If you've waited forever and the issue persists, email me.`,
    false
  );
  submitButton.disabled = true;
  submitButton.innerText = "Loading...";

  try {
    const token = await auth(userEmail, userPassword);
    const data = await makeRequest(queryEmail, token);
    const file = await generateFile(data);
    await downloadFile(file, "auto-generated.timetable");
    displayMessage(`Timetable successfully downloaded.`, false);
  } catch (error) {
    displayMessage(
      error instanceof CustomError
        ? error.message
        : `An unexpected error has occurred:<br /><code>${error}</code>`,
      true
    );
  } finally {
    submitButton.disabled = false;
    submitButton.innerText = "Download Timetable";
  }
});

function displayMessage(message, isError) {
  if (isError) console.error(message);
  errorDisplay.innerHTML = message;
  errorDisplay.style.color = isError ? "red" : "gray";
}

async function auth(schoolEmail, schoolPassword) {
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
  if (!response.ok)
    throw new CustomError(
      `Unable to authenticate with the school's website. Check your email or password.<br />Response from server: <code>${response.statusText}</code>`
    );
  const data = await response.json();
  return data.token;
}

async function makeRequest(userEmail, token) {
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
  if (!response.ok)
    throw new CustomError(
      `Unable to get your timetable from the school's website. Please try again later.<br />Response from server: <code>${response.statusText}</code>`
    );
  const data = await response.json();
  return data;
}

async function generateFile(apiData) {
  if (!Array.isArray(apiData) || apiData.length === 0) {
    throw new CustomError(
      "There is no timetable data available for this person."
    );
  }
  const courses = [];
  const colours = [
    [188 / 255, 64 / 255, 58 / 255], // Red
    [241 / 255, 158 / 255, 56 / 255], // Orange
    [247 / 255, 206 / 255, 85 / 255], // Yellow
    [133 / 255, 194 / 255, 64 / 255], // Green
    [109 / 255, 170 / 255, 195 / 255], // Light Blue
    [77 / 255, 116 / 255, 218 / 255], // Blue
    [161 / 255, 101 / 255, 220 / 255], // Purple
    [204 / 255, 106 / 255, 164 / 255], // Pink
    [120 / 255, 120 / 255, 120 / 255], // Gray
    [255 / 255, 99 / 255, 71 / 255], // Tomato Red
    [100 / 255, 149 / 255, 237 / 255], // Cornflower Blue
    [60 / 255, 179 / 255, 113 / 255], // Medium Sea Green
    [255 / 255, 215 / 255, 0 / 255], // Gold
    [153 / 255, 50 / 255, 204 / 255], // Dark Orchid
    [173 / 255, 216 / 255, 230 / 255], // Light Blue (Alice)
    [221 / 255, 160 / 255, 221 / 255], // Plum
    [255 / 255, 182 / 255, 193 / 255], // Light Pink
    [135 / 255, 206 / 255, 250 / 255], // Light Sky Blue
    [60 / 255, 179 / 255, 113 / 255], // Medium Sea Green
  ];

  let plistString = `
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
    <dict>
      <key>Settings</key>
      <dict>
        <key>ColorSettings</key>
        <dict>`;

  apiData.forEach((item) => {
    const courseName = item.CourseName.substring(
      0,
      item.CourseName.lastIndexOf(" ")
    );
    if (courses.indexOf(courseName) === -1) {
      courses.push(courseName);
      const colour = colours.pop() || [120 / 255, 120 / 255, 120 / 255];
      plistString += `
        <key>${courseName}</key>
        <array>
          <real>${colour[0]}</real>
          <real>${colour[1]}</real>
          <real>${colour[2]}</real>
        </array>`;
    }
  });

  plistString += `
      </dict>
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
    <array>`;

  apiData.forEach((item) => {
    const dayNum =
      parseInt(item.DayNumber, 10) <= 5
        ? item.DayNumber - 1
        : item.DayNumber - 6;
    const weekNum = parseInt(item.DayNumber, 10) <= 5 ? 0 : 1;
    const startTimeParts = item.StartTime.split(":");
    const endTimeParts = item.EndTime.split(":");
    const startTimeInSeconds =
      startTimeParts[0] * 3600 + startTimeParts[1] * 60;
    const endTimeInSeconds = endTimeParts[0] * 3600 + endTimeParts[1] * 60;

    plistString += `
      <dict>
        <key>dayNum</key>
        <integer>${dayNum}</integer>
        <key>time</key>
        <integer>${startTimeInSeconds}</integer>
        <key>endTime</key>
        <integer>${endTimeInSeconds}</integer>
        <key>title</key>
        <string>${item.CourseName.substring(
          0,
          item.CourseName.lastIndexOf(" ")
        )}</string>
        <key>info</key>
        <string>${item.RoomCode || "DefaultRoom"}\n${item.ClassCode}</string>
        <key>weekNum</key>
        <integer>${weekNum}</integer>
      </dict>`;
  });

  plistString += `
        </array>
      </dict>
    </plist>`;

  return plistString;
}

async function downloadFile(content, fileName) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: "application/xml" });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
