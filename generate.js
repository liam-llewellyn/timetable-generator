const plist = require("plist");
const fs = require("fs");

module.exports = async function generate(apiData) {
  const plistData = await fs.promises.readFile("blank.plist", "utf8");
  const plistObject = plist.parse(plistData);

  // Initialize an empty array to hold the new periods
  plistObject.WeekEvents = [];

  // Define the color array that will be used for all subjects
  const colorArray = [0.9327886, 0.5448206, 0.6688553];

  apiData.forEach((item) => {
    // Calculate dayNum and weekNum based on DayNumber
    let dayNum;
    let weekNum;
    if (parseInt(item.DayNumber) <= 5) {
      dayNum = parseInt(item.DayNumber, 10) - 1;
      weekNum = 0;
    } else if (
      parseInt(item.DayNumber) >= 6 &&
      parseInt(item.DayNumber) <= 10
    ) {
      dayNum = parseInt(item.DayNumber, 10) - 6;
      weekNum = 1;
    }

    // Convert StartTime and EndTime to seconds since midnight
    const startTimeParts = item.StartTime.split(":");
    const endTimeParts = item.EndTime.split(":");
    const startTimeInSeconds =
      startTimeParts[0] * 3600 + startTimeParts[1] * 60;
    const endTimeInSeconds = endTimeParts[0] * 3600 + endTimeParts[1] * 60;

    // Create a new period object
    const newPeriod = {
      dayNum,
      time: startTimeInSeconds,
      endTime: endTimeInSeconds,
      title: item.ClassCode,
      info: item.RoomCode || "DefaultRoom", // Use default room if RoomCode is not provided
      weekNum,
    };

    // Push the new period object to the WeekEvents array
    plistObject.WeekEvents.push(newPeriod);

    // Add a subject with the same color for all
    plistObject.Settings.ColorSettings[item.ClassCode] = colorArray;
  });

  // Convert the object back to a plist string
  const plistString = plist.build(plistObject);
  return plistString;
};
