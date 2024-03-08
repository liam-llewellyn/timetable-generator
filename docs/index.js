const email = "trophy_cuckoo_0d@icloud.com";
const errorDisplay = document.getElementById("error-display");
document
  .getElementById("timetable-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const inputField = document.getElementById("input-field");
    const passwordField = document.getElementById("password-field");
    const userEmail = inputField.value;
    const userPassword = passwordField.value;
    errorDisplay.innerHTML = `Waiting for the server to respond. This may take up to 50 seconds (because I'm using a free server hoster). If you've waited forever and the issue persists, <a href = \"mailto:${email}\" > email me</a >.`;
    errorDisplay.style["color"] = "gray";
    fetch(`https://timetable-generator-qus9.onrender.com/generateTimetable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail, userPassword }),
    })
      .then((response) => {
        if (response.status === 401) {
          errorDisplay.innerHTML = "The password is incorrect.";
          errorDisplay.style["color"] = "red";
          throw new Error("Error: Unauthorized");
        }
        if (!response.ok) {
          errorDisplay.innerHTML = `Looks like something has gone wrong. Maybe try reload the site or try again later. If the issue persists, <a href = \"mailto:${email}\" > email me</a >.`;
          errorDisplay.style["color"] = "red";
          throw new Error("Error: Network response was not ok");
        }
        errorDisplay.innerHTML = "";
        errorDisplay.style["color"] = "initial";
        // Get the Content-Disposition header to extract the filename
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "result.timetable";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.*)"/);
          if (filenameMatch.length === 2) {
            filename = filenameMatch[1];
          }
        }
        // Convert the response to a blob
        return response.blob().then((blob) => {
          // Create a URL for the blob
          const url = window.URL.createObjectURL(blob);
          // Create a new anchor element
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          // Append the anchor element to the document body
          document.body.appendChild(a);
          // Trigger a click event on the anchor element
          a.click();
          // Remove the anchor element from the document body
          document.body.removeChild(a);
          // Release the object URL
          window.URL.revokeObjectURL(url);
        });
      })
      .catch((error) => {
        errorDisplay.innerHTML = `Looks like something has gone wrong. Maybe try reload the site or try again later. If the issue persists, <a href = \"mailto:${email}\" > email me</a >.`;
        errorDisplay.style["color"] = "red";
        console.error("Error: Timetable was not able to be generated:", error);
      });
  });
