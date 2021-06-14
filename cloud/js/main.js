let cloudUI = {
  projects: "user-projects",
  classrooms: "user-classrooms",
  logout: "logout-btn",

  loadProject: "load-project",
  saveProjectAs: "save-project-as",
  applicationProjects: "project-list",
  classroomName: "classroom-name",

  signInPrompt: "signInPrompt",
  signInSubmit: "signUserIn",
  signInLoader: "signInLoader",
  signInErrorMsg: "signInErrorMsg",
  passwordVisibility: "show_hide_password-addon",
  passwordEyeIcon: "passwordEye",
  usernameField: "usernameField",
  passwordField: "passwordField",

  signOutPrompt: "signOutPrompt",
  signOutSubmit: "signUserOut",
  signOutLoader: "signOutLoader",
  signOutErrorMsg: "signOutErrorMsg",

  loadingOverlay: "loading-overlay",

  userAlertModal: "userAlert",
  userAlertMsg: "userAlertMsg",

  saveProjectPrompt: "saveProjectPrompt",
  saveProjectSubmit: "saveUserProject",
  saveProjectSignIn: "saveProjectSignIn",
  projectNameField: "projectNameField",
  saveProjectConfirm: "saveProjectConfirm",
  saveConfirmedSignIn: "saveProjectConfirmSignIn",
  saveConfirmedSubmit: "saveUserProjectConfirmed",
  saveConfirmMsg: "saveProjectConfirmMsg",

  loadProjectPrompt: "loadProjectPrompt",
  loadProjectSubmit: "loadUserProject",
  loadProjectList: "loadProjectList",
  loadProjectSignIn: "loadProjectSignIn",
  loadProjectMsg: "loadProjectPromptMsg",
  loadProjectLoader: "loadProjectLoader",

  loadLocalProject: "loadLocalProject",
  saveLocalProject: "saveLocalProject",

  navSignUp: "navSignUp",
  navUserStatus: "navUserStatus",
  navUserProjects: "navUserProjects",
  navUserProfile: "",
  navUserClassrooms: "navUserClassrooms",
  navSignOut: "navSignOut",
  navUserIcon: "navUserIcon",
  navUserDropdown: "navUserDropdown",
  navUserContainer: "navUserContainer",
};

let globals = {
  currentUsername: "",
  currentUserID: "",
  currentProjectName: "Untitled Project",
  currentProjectID: "",
  isLoggedIn: "false",
  modifiedSinceLastSave: "false",
  isNewProject: "true",
};

function Cloud(applicationID) {
  this.projAPIURL = "/api/projects/";
  this.fileAPIURL = "/api/files/";
  this.loginUrl = "/accounts/login/";
  this.loadProjURL = "/projects/";
  this.userAPIURL = "/api/user";
  this.logoutAPIURL = "/accounts/logout/";

  this.getCSRFToken();
  this.init(applicationID);
}

/** Global event binds
 *
 */

// Toggles the visibility of the user's password
$(`#${cloudUI.passwordVisibility}`).on("click", () => {
  togglePasswordVisibility();
});

// Toggles password visibility back to hidden, then clear password (for security purposes)
$(`#${cloudUI.signInPrompt}`).on("hide.bs.modal", function (event) {
  togglePasswordVisibility(true);
  $(`#${cloudUI.passwordField}`).val("");
});

// Updates global project name when user makes any changes to it
$(`#${cloudUI.projectNameField}`).on("keyup", () => {
  $(`#${cloudUI.projectNameField}`).attr(
    "value",
    $(`#${cloudUI.projectNameField}`).val()
  );
  globals.currentProjectName = $(`#${cloudUI.projectNameField}`).val();
});

/** init: Initializes the new cloud object with the current application information, then proceeds to load
 * any available projects, or start a new one.
 *
 * @param {num} applicationID The number attached to the application. Can be found in Django Admin
 */
Cloud.prototype.init = function (applicationID) {
  const myself = this;

  this.applicationID = applicationID;
  this.projectName = "";

  console.info(`Application:  ${myself.applicationID}`);

  // Check for current user and project
  this.getUser(
    (data) => {
      globals.isLoggedIn = !(data.id == null);
      if (data.id == null) {
        // If the get user response was successful, but they are not logged in
        globals.currentUserID, (globals.currentUsername = "");
      } else {
        // If the get user response was successful, and they are logged in
        globals.currentUserID = data.id;
        globals.currentUsername = data.username;
        myself.checkForCurrentProject();
      }
      myself.updateLayout();
      myself.updateProjectListing();
    },
    (err) => {
      // Lack of internet connection, wrong password, other errors
      console.error(`Note to Developer: Failed to get a current user.`);
      console.error(`Error Message: ${JSON.stringify(err)}`);
      globals.currentUserID, (globals.currentUsername = "");
      globals.isLoggedIn = false;
      myself.updateLayout();
    }
  );
};

/** getCSRFToken: Use this to allow other API calls besides login */
Cloud.prototype.getCSRFToken = function () {
  /** gets a cookie of a specific type from the page
      @param {String} name - should pretty much always be csrftoken
      @return {String} - returns the cookie
       */
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie != "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrftoken = getCookie("csrftoken");

  /** tests if this is csrf safe
      @param {String} method - tests the given method
      @return {Boolean} - is safe
       */
  function csrfSafeMethod(method) {
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
  }

  /** test that a given url is a same-origin URL
      @param {String} url - the URL to test
      @return {Boolean} - is same origin
       */
  function sameOrigin(url) {
    const host = document.location.host; // host + port
    const protocol = document.location.protocol;
    const srOrigin = "//" + host;
    const origin = protocol + srOrigin;
    return (
      url == origin ||
      url.slice(0, origin.length + 1) == origin + "/" ||
      url == srOrigin ||
      url.slice(0, srOrigin.length + 1) == srOrigin + "/" ||
      !/^(\/\/|http:|https:).*/.test(url)
    );
  }

  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    },
  });
};

/** getUser: Signed in, but don't know which user you are, call this
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.getUser = function (callBack, errorCallBack) {
  $.ajax({
    dataType: "json",
    url: this.userAPIURL,
    success: callBack,
  }).fail(errorCallBack);
};

/**checkForCurrentProject: Initially checks to see if there is a project available to load.
 *
 */
Cloud.prototype.checkForCurrentProject = function () {
  const myself = this;

  console.log("Checking for current project...");

  // First, check if there is a config object (which would contain the project information to load)
  if (typeof config === "undefined") {
    console.log("No project found. Continuing with initialization.");
    globals.isNewProject = true;
  } else {
    // If it was found, attempt to grab the config project id, then load the project file.
    try {
      if (Number.isInteger(Number(config.project.id))) {
        console.log("Project found. Proceeding with project load.");
        myself.loadFromCloud(config.project.id);
      }
    } catch (err) {
      console.error(
        "Note to Developer: There was an issue loading the config file."
      );
      console.error(`Error Message: ${JSON.stringify(err)}`);
    }
  }
};

/** updateProjectListing: fetches the updated project list, or add recently saved projects to project list
 * Handles and updates the project list
 * @param {boolean} pullFromAPI Default is true to pull a new project list from API, false to append to current list
 */
Cloud.prototype.updateProjectListing = function (pullFromAPI = true) {
  const myself = this;

  // Setting flag since whenever this is called, it will fetch from the API unless dictated otherwise
  let currentlyFetching = pullFromAPI;

  // Hide the dropdown
  $(`#${cloudUI.loadProjectList}`).attr("hidden", true);

  // First, update the text of the load message
  $(`#${cloudUI.loadProjectMsg}`).html(
    globals.isLoggedIn
      ? "Fetching projects, please wait..."
      : "Sign in to view your projects"
  );
  $(`#${cloudUI.loadProjectSubmit}`).attr("disabled", true);

  // Then determine if they are logged in or not.
  if (globals.isLoggedIn) {
    // Determine if we are clearing the project list, or just prepend to it.
    $(`#${cloudUI.loadProjectList}`).html(
      pullFromAPI ? "" : $(`#${cloudUI.loadProjectList}`).html()
    );

    // Show loader and load message
    $(`#${cloudUI.loadProjectLoader}`).addClass(
      currentlyFetching ? "d-flex" : ""
    );
    $(`#${cloudUI.loadProjectLoader}`).removeClass(
      currentlyFetching ? "d-none" : ""
    );
    $(`#${cloudUI.loadProjectMsg}`).attr("hidden", !currentlyFetching);

    // If the listProject get was successful, process the list of returned projects
    function successfullyFetchedProjects(projects) {
      // Since we are successful
      currentlyFetching = false;
      $(`#${cloudUI.loadProjectSubmit}`).attr("disabled", false);

      // Hide loader and load message
      $(`#${cloudUI.loadProjectLoader}`).addClass(
        !currentlyFetching ? "d-none" : ""
      );
      $(`#${cloudUI.loadProjectLoader}`).removeClass(
        !currentlyFetching ? "d-flex" : ""
      );
      $(`#${cloudUI.loadProjectMsg}`).attr("hidden", !currentlyFetching);

      // Show the project list.
      $(`#${cloudUI.loadProjectList}`).attr("hidden", false);

      // Map option creation to each of the projects that match current application ID
      // Using map vs. forEach because map was faster for me...
      let userProjects = projects.map((project) => {
        // Only append the projects that have the same ID
        if (project.application == myself.applicationID) {
          $(`#${cloudUI.loadProjectList}`).append(
            $("<option />").val(project.id).text(project.name).data({
              classroom: project.classroom, // Adding data attributes for possible classroom and screenshot update later on..
              screenshot: project.screenshot_url,
            })
          );
          return project;
        } else {
          return {};
        }
      });
    }

    // If the listProject failed, debug to console.
    // Note to self: need to add user feedback to let them know that the project fetch failed, and to try again.
    function errorFetchingProjects(err) {
      console.error(
        "Note to Developer: Failed to fetch current user's projects"
      );
      console.error(`Error Message: ${JSON.stringify(err)}`);
    }

    // Retrieve the projects
    myself.listProject(
      globals.currentUserID,
      successfullyFetchedProjects,
      errorFetchingProjects
    );
  } else {
    // Hide and empty the project list, then show the load message prompting them to login.
    $(`#${cloudUI.loadProjectMsg}`).attr("hidden", false);
    $(`#${cloudUI.loadProjectList}`).attr("hidden", true);
    $(`#${cloudUI.loadProjectList}`).html("");
  }
};
/** listProject: Get the list of projects for the current user, must be signed in
@param {int} userID - ID of the number of user
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.listProject = function (userID, callBack, errorCallBack) {
  $.get(this.projAPIURL + "?owner=" + userID, null, callBack, "json").fail(
    errorCallBack
  );
};

/** loadProject: Already got a project, no problem, just load it with this function
@param {int} projectID - ID of the number to be updated
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.loadProject = function (projectID, callBack, errorCallBack) {
  $.get(this.projAPIURL + projectID + "/", null, function (data) {
    $.get(data.project_url, null, function (proj) {
      callBack(data, proj);
    }).fail(errorCallBack);
  }).fail(errorCallBack);
};

/** updateProject: Update a project instead of making a new one
@param {int} projectID - ID of the number to be updated
@param {String} projectName - Name of your project
@param {int} applicationID - The number of the application you're using
@param {String} dataID - The file location from save file call back
@param {String} imgID - The image file location important for viewing projects
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.updateProject = function (
  projectID,
  projectName,
  applicationID,
  dataID,
  imgID,
  callBack,
  errorCallBack
) {
  $.ajax({
    type: "PUT",
    url: this.projAPIURL + projectID + "/",
    data: {
      name: projectName,
      description: "",
      classroom: null,
      application: applicationID,
      project: dataID,
      screenshot: imgID,
    },
    success: callBack,
    dataType: "json",
  }).fail(errorCallBack);
};

/** createProject: Make a project to be able to find your saved file again, returns the details
of the project created, including ID for updating
@param {String} projectName - Name of your project
@param {int} applicationID - The number of the application you're using
@param {String} dataID - The file location from save file call back
@param {String} imgID - The image file location important for viewing projects
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.createProject = function (
  projectName,
  applicationID,
  dataID,
  imgID,
  callBack,
  errorCallBack
) {
  $.post(
    this.projAPIURL,
    {
      name: projectName,
      description: "",
      classroom: "",
      application: applicationID,
      project: dataID,
      screenshot: imgID,
    },
    callBack,
    "json"
  ).fail(errorCallBack);
};

/** saveFile: Saves a file to the server, save the ID for use with create / update project
@param {String} file - The data to be uploaded
@param {function} callBack - The returned function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.saveFile = function (file, callBack, errorCallBack) {
  $.ajax({
    type: "PUT",
    url: this.fileAPIURL,
    data: file,
    processData: false,
    contentType: false,
    success: callBack,
  }).fail(errorCallBack);
};

/** submitSignInRequest: Attached to the sign in button (as part of the sign in prompt). This actually gathers the user's credentials, attempt
 * the sign in, then updates the application as needed
 */
Cloud.prototype.submitSignInRequest = function () {
  const myself = this;

  // Grab a CSRF Token
  myself.getCSRFToken();

  // Grab username and password
  let username = $(`#${cloudUI.usernameField}`).val();
  let password = $(`#${cloudUI.passwordField}`).val();

  // Show a loading indicator
  $(`#${cloudUI.signInLoader}`).addClass("d-flex");
  $(`#${cloudUI.signInLoader}`).removeClass("d-none");

  // Hide the form
  $(`#${cloudUI.signInPrompt} div div div.modal-body`).attr("hidden", true);

  // If validating the user was successful
  let successfulGetUser = function (data) {
    globals.currentUserID = data.id;
    globals.currentUsername = data.username;
    globals.isLoggedIn = true;

    // Hide the sign in modal
    $(`#${cloudUI.signInPrompt}`).modal("hide");

    // Reset loading indicator
    $(`#${cloudUI.signInLoader}`).addClass("d-none");
    $(`#${cloudUI.signInLoader}`).removeClass("d-flex");

    // Reset form
    $(`#${cloudUI.signInPrompt} div div div.modal-body`).attr("hidden", false);

    // Alert the user that they were successful
    myself.alertUser(`Sign in successful,  ${globals.currentUsername}`, 2000);

    // Update the layout and projects
    myself.updateLayout();
    myself.updateProjectListing();
  };

  // If validating the user failed
  let failedGetUser = function (err) {
    globals.loggedIn = false;

    // Hide the loading indicator
    $(`#${cloudUI.signInLoader}`).addClass("d-none");
    $(`#${cloudUI.signInLoader}`).removeClass("d-flex");

    // Show the form
    $(`#${cloudUI.signInPrompt} div div div.modal-body`).attr("hidden", false);

    // Show the error msg to user
    $(`#${cloudUI.signInErrorMsg}`).attr("hidden", false);

    // Add events to username and password that will hide the error msg when user starts editing either.
    $(`#${cloudUI.usernameField}, #${cloudUI.passwordField}`).on(
      "keyup",
      (e) => {
        if (!$(`#${cloudUI.signInErrorMsg}`).attr("hidden")) {
          $(`#${cloudUI.signInErrorMsg}`).attr("hidden", true);
        }
      }
    );

    // Log the error in console
    console.error(`Note to Developer: Failed to get user on sign in request.`);
    console.error(`Error Message: ${JSON.stringify(err)}`);
  };

  // Log the user in and verify their information was correct
  myself.signIn(
    username,
    password,
    (data) => {
      myself.getUser(successfulGetUser, failedGetUser);
    },
    failedGetUser
  );
};

/** signIn: Log in does what it sounds like, makes a post to the API to log you in,
follow up with get CSRF or Get user data.
@param {String} username - Username to log in with
@param {String} password - Password to log in with
@param {function} callBack - The returned function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.signIn = function (
  username,
  password,
  callBack,
  errorCallBack
) {
  $.post(
    this.loginUrl,
    {
      login: username,
      password: password,
    },
    callBack
  ).fail(errorCallBack);
};

/** submitSignOutRequest: Attached to the sign out button (as part of the sign out prompt).
 *
 */
Cloud.prototype.submitSignOutRequest = function () {
  const myself = this;

  // Grab a CSRF Token
  myself.getCSRFToken();

  // Show a loading indicator
  $(`#${cloudUI.signOutLoader}`).addClass("d-flex");
  $(`#${cloudUI.signOutLoader}`).removeClass("d-none");

  // Hide the form
  $(`#${cloudUI.signOutPrompt} div div div.modal-body`).attr("hidden", true);

  //If logout was successful
  let successfulLogoutAttempt = function (data) {
    globals.currentUserID = "";
    globals.currentUsername = "";
    globals.isLoggedIn = false;

    // Hide the sign in modal
    $(`#${cloudUI.signOutPrompt}`).modal("hide");

    // Reset loading indicator
    $(`#${cloudUI.signOutLoader}`).addClass("d-none");
    $(`#${cloudUI.signOutLoader}`).removeClass("d-flex");

    // Reset form
    $(`#${cloudUI.signOutPrompt} div div div.modal-body`).attr("hidden", false);

    // Alert the user that they were successful
    myself.alertUser(`Logout was successful`, 2000);

    // Update the layout and projects
    myself.updateLayout();
    myself.updateProjectListing();
  };

  // If logout failed
  let failedLogoutAttempt = function (err) {
    // Hide the loading indicator
    $(`#${cloudUI.signOutLoader}`).addClass("d-none");
    $(`#${cloudUI.signOutLoader}`).removeClass("d-flex");

    // Show the form
    $(`#${cloudUI.signOutPrompt} div div div.modal-body`).attr("hidden", false);

    // Show the error msg to user
    $(`#${cloudUI.signOutErrorMsg}`).attr("hidden", false);

    // Add events to username and password that will hide the error msg when user starts editing either.
    $(`#${cloudUI.signOutPrompt}`).on("click", (e) => {
      if (!$(`#${cloudUI.signOutErrorMsg}`).attr("hidden")) {
        $(`#${cloudUI.signOutErrorMsg}`).attr("hidden", true);
      }
    });

    // Log the error in console
    myself.alertUser(
      "There was an error when signing you out. Please try again.",
      3500
    );
    console.error(
      `Note to Developer: Failed to successfully log the user out.`
    );
    console.error(`Error Message: ${JSON.stringify(err)}`);
  };

  myself.signOut(successfulLogoutAttempt, failedLogoutAttempt);
};

/** signOut: Want to logout, no worries, you're not trapped anymore
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.signOut = function (callBack, errorCallBack) {
  $.post(this.logoutAPIURL, {}, callBack, "json").fail(errorCallBack);
};

/** alertUser: Allows you to create messages for the user (i.e. alerting them that they were successful in saving)
 *
 * @param {string} message What message do you want to display
 * @param {number} timeout How long do you want to have the message active for (no number will keep it on the screen indefinitely)
 */
Cloud.prototype.alertUser = function (message, timeout) {
  $(`#${cloudUI.userAlertMsg}`).html(message);
  $(`#${cloudUI.userAlertModal}`).modal("show");

  if (timeout > 0) {
    setTimeout(function () {
      $(`#${cloudUI.userAlertModal}`).modal("hide");
    }, timeout);
  }
};

/** updateLayout: Sets user interface states of the cloud elements based on login status
 *
 */
Cloud.prototype.updateLayout = function () {
  let currentUserProfileURL = `/users/${globals.currentUserID}`;
  let currentUserClassroomsURL = `${currentUserProfileURL}/classes`;

  // Update navigation to either show the sign in / login, or the username
  $(`#${cloudUI.navSignUp}`).attr("hidden", globals.isLoggedIn);
  $(`#${cloudUI.navUserStatus}`).html(
    `<i class='${globals.isLoggedIn ? "fas" : "far"} fa-user'></i>&nbsp; ${
      globals.isLoggedIn ? globals.currentUsername : "Login"
    }`
  );
  $(`#${cloudUI.navUserProjects}`).attr(
    "href",
    globals.isLoggedIn ? currentUserProfileURL : ""
  );
  $(`#${cloudUI.navUserClassrooms}`).attr(
    "href",
    globals.isLoggedIn ? currentUserClassroomsURL : ""
  );
  $(`#${cloudUI.navSignOut}`).attr("hidden", !globals.isLoggedIn);

  $(`#${cloudUI.navUserStatus}`).addClass(
    globals.isLoggedIn ? "dropdown-toggle" : ""
  );
  $(`#${cloudUI.navUserStatus}`).removeClass(
    !globals.isLoggedIn ? "dropdown-toggle" : ""
  );
  $(`#${cloudUI.navUserStatus}`).attr(
    "data-toggle",
    globals.isLoggedIn ? "dropdown" : "modal"
  );
  $(`#${cloudUI.navUserStatus}`).attr(
    "data-target",
    globals.isLoggedIn ? "" : "#signInPrompt"
  );
  $(`#${cloudUI.navUserStatus}`).attr("aria-expanded", false);

  $(`#${cloudUI.navUserDropdown}`).removeClass(
    !globals.isLoggedIn ? "show" : ""
  );
  $(`#${cloudUI.navUserContainer}`).removeClass(
    !globals.isLoggedIn ? "show" : ""
  );
  if (!globals.isLoggedIn) {
    $(`#${cloudUI.navUserStatus}`).dropdown("dispose");
  }

  // Set the state of project saves (either having users login first or allow them to save)
  $(`#${cloudUI.saveProjectSubmit}`).attr("hidden", !globals.isLoggedIn);
  $(`#${cloudUI.saveProjectSignIn}`).attr("hidden", globals.isLoggedIn);

  // Set the state of project loads (either having users login first or allow them to load project)
  $(`#${cloudUI.loadProjectSubmit}`).attr("hidden", !globals.isLoggedIn);
  $(`#${cloudUI.loadProjectSignIn}`).attr("hidden", globals.isLoggedIn);

  //Set the state of the save confirmation alert
  $(`#${cloudUI.saveConfirmedSubmit}`).attr("hidden", !globals.isLoggedIn);
  $(`#${cloudUI.saveConfirmedSignIn}`).attr("hidden", globals.isLoggedIn);
  $(`#${cloudUI.saveConfirmMsg}`).html(
    globals.isLoggedIn
      ? "Are you sure you want to replace your current project?"
      : "Sign in to save your work."
  );
};

/** updateURL: Updates the current url based on the current project number */
Cloud.prototype.updateURL = function (URL) {
  if (window.history !== undefined && window.history.pushState !== undefined) {
    window.history.pushState({}, "", "/projects/" + URL + "/run");
  }
};

Cloud.prototype.loadFromCloud = function (projectID, loadCallback) {
  const myself = this;

  // Handle the loading modal and alert the user that project is loading
  $(`#${cloudUI.loadProjectPrompt}`).modal("hide");
  myself.alertUser("Loading project. Please wait...");

  // If the project find was successful, load the file received
  let successfulProjectLoad = function (data, proj) {
    // Helper function to perform the load
    loadCallback(proj);

    // Update the url
    myself.updateURL(projectID);

    // Update flags and globals
    // globals.modifiedSinceLastSave = false;
    globals.isNewProject = false;
    globals.currentProjectID = projectID;
    globals.currentProjectName = data.name;

    // Update project name
    $(`#${cloudUI.projectNameField}`).attr("value", globals.currentProjectName);

    // Alert the user that it was a success
    myself.alertUser("Successfully loaded the project.", 2000);
  };

  let failedProjectLoad = function (data) {
    myself.alertUser("Error loading your project. Please try again", 4000);
    console.error(`Note to Developer: Failed cloud project fetch.`);
    console.error(`Error Message: ${data}`);
  };

  myself.loadProject(projectID, successfulProjectLoad, failedProjectLoad);
};

Cloud.prototype.saveToCloud = function (projectObject, callback) {
  const myself = this;

  let projectForm = new FormData();
  let imageForm = new FormData();
  let projectData, imageData;
  let imageID = 1000;
  let dataID = "";

  // First, get a CSRF Token
  myself.getCSRFToken();

  // Second, alert the user that their project is saving
  $(`#${cloudUI.saveProjectPrompt}`).modal("hide");
  $(`#${cloudUI.saveProjectConfirm}`).modal("hide");
  myself.alertUser("Saving your project. Please wait...");

  // Third, get the project data based on the application
  switch (myself.applicationID) {
    case 99:
      /**
       * Cornrow Curves Math
       *
       * dataCallback: returns an object of the stringified braid and stage
       * image, ready to be converted to a blob.
       *  */
      let cornrowsData = projectObject;
      projectData = dataToBlob(cornrowsData.project, "application/json");
      imageData = dataToBlob(cornrowsData.image, "image/png");

      projectForm.append("file", projectData);
      imageForm.append("file", imageData);
      break;
    case 90:
      /**
       * Rhythm Wheels
       *
       * dataCallback: returns an object of the stringified braid and stage
       * image, ready to be converted to a blob.
       *  */
      let rhythmData = {};
      rhythmData.string = projectObject;

      projectData = new Blob([JSON.stringify(rhythmData)], {
        type: "application/json",
      });

      projectForm.append("file", projectData);
      // imageForm.append('file', imageData);
      break;

    default:
      console.log("Default case");
  }

  let successfulPreImageSave = function (data) {
    imageID = data.id;

    let successfulPreProjectSave = function (data) {
      dataID = data.id;

      let successfulFileUpload = function (data) {
        globals.currentProjectID = data.id;
        // globals.modifiedSinceLastSave = false;
        globals.isNewProject = false;
        myself.updateURL(globals.currentProjectID);
        myself.alertUser("Success. Your project was saved.", 2500);
        myself.updateProjectListing();

        // // Determine if the url needs to update
        // if (data.id != globals.currentProjectID) {
        //     globals.currentProjectID = data.id;
        //     myself.updateURL(globals.currentProjectID);
        // }
      };

      let failedFileUpload = function (data) {
        myself.alertUser(
          "There was an error with saving. Please try again.",
          3500
        );
        console.error(`Note to Developer: Cloud saving project upload failed.`);
        console.error(`Error Message: ${JSON.stringify(data)}`);
      };

      if (globals.isNewProject || globals.currentProjectID == "") {
        myself.createProject(
          globals.currentProjectName,
          myself.applicationID,
          dataID,
          imageID,
          successfulFileUpload,
          failedFileUpload
        );
      } else {
        myself.updateProject(
          globals.currentProjectID,
          globals.currentProjectName,
          myself.applicationID,
          dataID,
          imageID,
          successfulFileUpload,
          failedFileUpload
        );
      }
    };
    let failedPreProjectSave = function (data) {
      myself.alertUser(
        "There was an error with saving. Please try again.",
        3500
      );
      console.error(`Note to Developer: Cloud saving pre project save failed.`);
      console.error(`Error Message: ${data}`);
    };
    myself.saveFile(
      projectForm,
      successfulPreProjectSave,
      failedPreProjectSave
    );
  };

  let failedPreImageSave = function (data) {
    myself.alertUser("There was an error with saving. Please try again.", 3500);
    console.error(`Note to Developer: Cloud saving pre image save failed.`);
    console.error(`Error Message: ${JSON.stringify(data)}`);
  };

  myself.saveFile(imageForm, successfulPreImageSave, failedPreImageSave);
};

Cloud.prototype.setNewProjectStatus = function (state) {
  console.log(`Saving ${state ? "new" : "current"} project...`);
  globals.isNewProject = state;
  console.log(`isNewProject: ${globals.isNewProject}`);
};

/** Helper functions
 *
 * Helper functions for Cornrow Curves, Navajo Rug Weaver, Northwest Basket Weaver, Virtual Bead Loom
 * Kindly donated by http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
 */

function dataURItoBlob(dataURI, type) {
  var binary;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    binary = atob(dataURI.split(",")[1]);
  else binary = unescape(dataURI.split(",")[1]);
  //var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {
    type: type,
  });
}

function dataToBlob(data, type) {
  let data_str;
  if (type.includes("image")) {
    data_str = data.toDataURL();
    return dataURItoBlob(data_str, "image/png");
  } else {
    data_str = serializeData(data);
    return new Blob([data_str], {
      type: "application/json",
    });
  }
}

function serializeData(data) {
  return JSON.stringify(data.map((b) => b.serialize()));
}

/** printApplicationPage: Prints the page in landscape for the user**/
function printApplicationPage() {
  // Injects style into the document in order for window.print() to print in landscape
  let css = "@page { size: landscape; }",
    head = document.head || document.getElementsByTagName("head")[0],
    style = document.createElement("style");

  style.type = "text/css";
  style.media = "print";

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);

  // Prints the body of the page (everything under the navigation bar)
  window.print();
}

/** downloadStringAsFile: Downloads a text string as a file. Used in CC Math.
 * @param {string} filename
 * @param {string} text
 */
function downloadStringAsFile(filename, text) {
  let element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

/** togglePasswordVisibility: Toggles the visibility of the user's password for more user friendly interaction
 *
 * @param {bool} forceHidden Set if the password should be hidden or not. Default is false
 */
function togglePasswordVisibility(forceHidden = false) {
  let eyeStatus = forceHidden
    ? false
    : $(`#${cloudUI.passwordEyeIcon}`).hasClass("fa-eye-slash");
  $(`#${cloudUI.passwordEyeIcon}`).removeClass(
    eyeStatus ? "fa-eye-slash" : "fa-eye"
  );
  $(`#${cloudUI.passwordEyeIcon}`).addClass(
    eyeStatus ? "fa-eye" : "fa-eye-slash"
  );
  $(`#${cloudUI.passwordField}`).attr("type", eyeStatus ? "text" : "password");
}

/** setLoadingOverlay: Sets the duration of the loading overlay.
 *
 * @param {bool} isHidden Force a visibility state
 * @param {bool} hasTimeout Times out the loading overlay after 3 seconds (mostly for testing). Default is false.
 */
function setLoadingOverlay(isHidden, hasTimeout = false) {
  $(`.${cloudUI.loadingOverlay}`).attr("hidden", isHidden);

  if (hasTimeout) {
    setTimeout(function () {
      $(`.${cloudUI.loadingOverlay}`).attr("hidden", true);
    }, 3000);
  }
}

/**
 *
 * Developer testing functions and event bindings
 *
 */

function toggleCurrentUser() {
  globals.isLoggedIn = !globals.isLoggedIn;

  globals.currentUserID = globals.isLoggedIn ? 59 : "";
  globals.currentUsername = globals.isLoggedIn ? "localtest" : "";

  if (typeof csdtCloud != "undefined") {
    if (csdtCloud instanceof Cloud) {
      csdtCloud.updateLayout();
      $(`#toggle-current-user`).html(
        `${globals.isLoggedIn ? "Disable" : "Enable"} User`
      );
    }
  }
}

$(`#toggle-current-user`).on("click", () => {
  toggleCurrentUser();
});

$(`#trigger-overlay`).on("click", () => {
  setLoadingOverlay(false, true);
});

// Need to add case for just updating the project list (or just an append function) (Actually, I am just going to pull whenever a user saves a project.)
// Possibly add loading project msg and loader for the cloud loading rather than a user alert...
