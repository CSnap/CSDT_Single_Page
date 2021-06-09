/* eslint-disable */

let cloudUI = {
    projects: "user-projects",
    classrooms: "user-classrooms",
    logout: "logout-btn",

    loadProject: "load-project",
    saveProjectAs: "save-project-as",
    applicationProjects: "project-list",
    classroomName: "classroom-name",


    signInPrompt: 'signInPrompt',
    signInSubmit: 'signUserIn',
    passwordVisibility: 'show_hide_password-addon',
    passwordEyeIcon: 'passwordEye',
    usernameField: 'usernameField',
    passwordField: 'passwordField',

    signOutPrompt: 'signOutPrompt',
    signOutSubmit: 'signUserOut',

    loadingOverlay: 'loading-overlay',

    userAlertModal: 'userAlert',
    userAlertMsg: 'userAlertMsg',

    saveProjectPrompt: 'saveProjectPrompt',
    saveProjectSubmit: "saveUserProject",
    saveProjectSignIn: 'saveProjectSignIn',
    projectNameField: 'projectNameField',
    saveProjectConfirm: 'saveProjectConfirm',
    saveConfirmedSignIn: 'saveProjectConfirmSignIn',
    saveConfirmedSubmit: 'saveUserProjectConfirmed',
    saveConfirmMsg: 'saveProjectConfirmMsg',

    loadProjectPrompt: 'loadProjectPrompt',
    loadProjectSubmit: 'loadUserProject',
    loadProjectList: 'loadProjectList',
    loadProjectSignIn: 'loadProjectSignIn',
    loadProjectMsg: 'loadProjectPromptMsg',
    loadProjectLoader: 'loadProjectLoader',

    loadLocalProject: 'loadLocalProject',
    saveLocalProject: 'saveLocalProject',

    navSignUp: 'navSignUp',
    navUserStatus: 'navUserStatus',
    navUserProjects: 'navUserProjects',
    navUserProfile: '',
    navUserClassrooms: 'navUserClassrooms',
    navSignOut: 'navSignOut',
    navUserIcon: 'navUserIcon',
    navUserDropdown: 'navUserDropdown',
    navUserContainer: 'navUserContainer'

};

let globals = {
    currentUsername: "",
    currentUserID: "",
    currentProjectName: "Untitled",
    currentProjectID: "",
    isLoggedIn: "false",
    modifiedSinceLastSave: "false",
    isNewProject: "false"

}

function Cloud(applicationID) {

    this.projAPIURL = '/api/projects/';
    this.fileAPIURL = '/api/files/';
    this.loginUrl = '/accounts/login/';
    this.loadProjURL = '/projects/';
    this.userAPIURL = '/api/user';
    this.logoutAPIURL = '/accounts/logout/';


    this.getCSRFToken();
    this.init(applicationID);
}



$(`#${cloudUI.passwordVisibility}`).on('click', () => {
    togglePasswordVisibility();
});

$(`#${cloudUI.signInPrompt}`).on('hide.bs.modal', function (event) {
    togglePasswordVisibility(true);
    $(`#${cloudUI.passwordField}`).val('');
});




$(`#${cloudUI.signInSubmit}`).on('click', () => {});
$(`#${cloudUI.signOutSubmit}`).on('click', () => {});

$(`#${cloudUI.signInPrompt}`).on('keydown', function ( e ) {
    var key = e.which || e.keyCode;
    if (key == 13) {
        // console.log('entered');
    }
});

Cloud.prototype.init = function (applicationID) {
    const myself = this;

    this.applicationID = applicationID;
    this.projectName = '';

    console.info(`Application:  ${myself.applicationID}`);

    // Check for current user and project
    this.getUser(
        (data) => {
            globals.isLoggedIn = !(data.id == null);
            if (data.id == null) {
                // If the get user response was successful, but they are not logged in
                globals.currentUserID, globals.currentUsername = "";
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
            console.error(`Error Message: ${JSON.stringify(err)}`)
            globals.currentUserID, globals.currentUsername = "";
            globals.isLoggedIn = false;
            myself.updateLayout();
        }
    );




};

/** Use this to allow other API calls besides login */
Cloud.prototype.getCSRFToken = function () {
    /** gets a cookie of a specific type from the page
      @param {String} name - should pretty much always be csrftoken
      @return {String} - returns the cookie
       */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie != '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(
                        name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    /** tests if this is csrf safe
      @param {String} method - stests the given method
      @return {Boolean} - is safe
       */
    function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    /** test that a given url is a same-origin URL
      @param {String} url - the URL to test
      @return {Boolean} - is same origin
       */
    function sameOrigin(url) {
        const host = document.location.host; // host + port
        const protocol = document.location.protocol;
        const srOrigin = '//' + host;
        const origin = protocol + srOrigin;
        return (url == origin ||
                url.slice(0, origin.length + 1) == origin + '/') ||
            (url == srOrigin ||
                url.slice(0, srOrigin.length + 1) == srOrigin + '/') ||
            !(/^(\/\/|http:|https:).*/.test(url));
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            }
        },
    });
};

/** Signed in, but don't know which user you are, call this
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.getUser = function (callBack, errorCallBack) {
    $.ajax({
        dataType: 'json',
        url: this.userAPIURL,
        success: callBack,
    }).fail(errorCallBack);
};






/** Get the list of projects for the current user, must be signed in
@param {int} userID - ID of the number of user
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.listProject = function (userID, callBack, errorCallBack) {
    $.get(this.projAPIURL + '?owner=' + userID, null,
        callBack, 'json').fail(errorCallBack);
};

/** Already got a project, no problem, just load it with this function
@param {int} projectID - ID of the number to be updated
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.loadProject = function (projectID,
    callBack,
    errorCallBack) {
    $.get(this.projAPIURL + projectID + '/', null, function (data) {
        $.get(data.project_url, null,
            function (proj) {
                callBack(data, proj);
            }).fail(errorCallBack);
    }).fail(errorCallBack);
};

/** Update a project instead of making a new one
@param {int} projectID - ID of the number to be updated
@param {String} projectName - Name of your project
@param {int} applicationID - The number of the application you're using
@param {String} dataID - The file location from save file call back
@param {String} imgID - The image file location important for viewing projects
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.updateProject = function (projectID,
    projectName,
    applicationID,
    dataID,
    imgID,
    callBack,
    errorCallBack) {
    $.ajax({
        type: 'PUT',
        url: this.projAPIURL + projectID + '/',
        data: {
            name: projectName,
            description: '',
            classroom: null,
            application: applicationID,
            project: dataID,
            screenshot: imgID,
        },
        success: callBack,
        dataType: 'json',
    }).fail(errorCallBack);
};

/** Make a project to be able to find your saved file again, returns the details
of the project created, including ID for updating
@param {String} projectName - Name of your project
@param {int} applicationID - The number of the application you're using
@param {String} dataID - The file location from save file call back
@param {String} imgID - The image file location important for viewing projects
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.createProject = function (projectName,
    applicationID,
    dataID,
    imgID,
    callBack,
    errorCallBack) {
    $.post(this.projAPIURL, {
        name: projectName,
        description: '',
        classroom: '',
        application: applicationID,
        project: dataID,
        screenshot: imgID,
    }, callBack, 'json').fail(errorCallBack);
};

/** Saves a file to the server, save the ID for use with create / update project
@param {String} file - The data to be uploaded
@param {function} callBack - The returned function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.saveFile = function (file, callBack, errorCallBack) {
    $.ajax({
        type: 'PUT',
        url: this.fileAPIURL,
        data: file,
        processData: false,
        contentType: false,
        success: callBack,
    }).fail(errorCallBack);
};






/** Attached to the sign in button (as part of the sign in prompt). This actually gathers the user's credendials, attempt
 * the sign in, then updates the application as needed
 */
Cloud.prototype.submitSignInRequest = function () {
    const myself = this;

    // Grab a CSRF Token
    myself.getCSRFToken();

    // Grab username and password
    let username = $(`#${cloudUI.usernameField}`).val();
    let password = $(`#${cloudUI.passwordField}`).val();

    // Hide the modal
    $(`#${cloudUI.signInPrompt}`).modal('hide');

    // Show a loading indicator 

    // If validating the user was successful
    let successfulGetUser = function (data) {
        globals.currentUserID = data.id;
        globals.currentUsername = data.username;
        globals.isLoggedIn = true;

        myself.alertUser(`Sign in successful,  ${globals.currentUsername}`, 2000);
        myself.updateLayout();
        myself.updateProjectListing();
    }

    // If validating the user failed
    let failedGetUser = function (err) {
        globals.loggedIn = false;
        myself.alertUser('Your username or password was incorrect. Please try again.', 3500);
        console.error(`Note to Developer: Failed to get user on sign in request.`);
        console.error(`Error Message: ${JSON.stringify(err)}`)
    }

    // Log the user in and verify their information was correct
    myself.signIn(username, password, (data) => {
        myself.getUser(successfulGetUser, failedGetUser);
    }, failedGetUser);
}

/** Log in does what it sounds like, makes a post to the API to log you in,
follow up with get CSRF or Get user data.
@param {String} username - Username to log in with
@param {String} password - Password to log in with
@param {function} callBack - The returned function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.signIn = function (username,
    password,
    callBack,
    errorCallBack) {
    $.post(this.loginUrl, {
            'login': username,
            'password': password
        },
        callBack).fail(errorCallBack);
};

/** Attached to the sign out button (as part of the sign out prompt).
 * 
 */
Cloud.prototype.submitSignOutRequest = function () {
    const myself = this;

    // Grab a CSRF Token
    myself.getCSRFToken();

    //If logout was successful
    let successfulLogoutAttempt = function (data) {
        globals.currentUserID = "";
        globals.currentUsername = "";
        globals.isLoggedIn = false;

        myself.alertUser(`Logout was successful`, 2000);
        myself.updateLayout();
        myself.updateProjectListing();
    }

    // If logout failed
    let failedLogoutAttempt = function (err) {
        myself.alertUser('There was an error when signing you out. Please try again.', 3500);
        console.error(`Note to Developer: Failed to successfully log the user out.`);
        console.error(`Error Message: ${JSON.stringify(err)}`)
    }

    myself.signOut(successfulLogoutAttempt, failedLogoutAttempt);
}

/** Want to logout, no worries, you're not trapped anymore
@param {function} callBack - The return function
@param {function} errorCallBack - If there is an error
*/
Cloud.prototype.signOut = function (callBack, errorCallBack) {
    $.post(this.logoutAPIURL, {}, callBack, 'json').fail(errorCallBack);
};






/** Updates the current url based on the current project number */
Cloud.prototype.updateURL = function (URL) {

    if (window.history !== undefined && window.history.pushState !== undefined) {
        window.history.pushState({}, "", '/projects/' + URL + "/run");
    }
};


Cloud.prototype.loadFromCloud = function (projectID, loadCallback) {
    const myself = this;

    // Handle the loading modal and alert the user that project is loading
    $(`#${constants.load_prompt}`).modal('hide');
    myself.alertUser('Loading project. Please wait...');


    // If the project find was successful, load the file recieved 
    let successfulProjectLoad = function (data, proj) {

        // Helper function to perform the load
        loadCallback(proj);

        // Update the url
        myself.cloud.updateURL(projectID);

        // Update flags and globals
        myself.modifiedSinceLastSave = false;
        myself.newProject = false;
        myself.projectID = projectID;

    };

    let failedProjectLoad = function (data) {
        myself.alertUser('Error loading your project. Please try again', 4000);
        console.error(`Note to Developer: Failed cloud project fetch.`);
        console.error(`Error Message: ${data}`)
    };

    myself.loadProject(projectID, successfulProjectLoad, failedProjectLoad);

}

Cloud.prototype.saveToCloud = function (projectObject, callback) {
    const myself = this;

    let projectForm = new FormData();
    let imageForm = new FormData();
    let projectData, imageData;
    let imageID = 1000;
    let dataID = '';

    // First, get a CSRF Token
    this.getCSRFToken();

    // Second, alert the user that their project is saving
    this.alertUser('Saving your project. Please wait...');

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
            projectData = dataToBlob(cornrowsData.project, 'application/json');
            imageData = dataToBlob(cornrowsData.image, 'image/png');

            projectForm.append('file', projectData);
            imageForm.append('file', imageData);
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
                type: 'application/json',
            });

            projectForm.append('file', projectData);
            // imageForm.append('file', imageData);
            break;

        default:
            console.log('Default case');
    }

    let successfulPreImageSave = function (data) {
        imageID = data.id;

        let successfulPreProjectSave = function (data) {
            dataID = data.id;

            let successfulFileUpload = function (data) {
                myself.projectID = data.id;
                myself.updateURL(myself.projectID);
                myself.alertUser('Success. Your project was saved.', 2500);

                myself.modifiedSinceLastSave = false;

                // Determine if the url needs to update
                if (data.id != myself.projectID) {
                    myself.projectID = data.id;
                    myself.updateURL(myself.projectID);
                }

            }

            let failedFileUpload = function (data) {
                myself.alertUser('There was an error with saving. Please try again.', 3500);
                console.error(`Note to Developer: Cloud saving project upload failed.`);
                console.error(`Error Message: ${data}`)
            }

            if (myself.newProject) {
                myself.createProject(myself.projectName, myself.applicationID, dataID,
                    imageID, successfulFileUpload, failedFileUpload);
            } else {
                myself.updateProject(myself.projectID, myself.projectName,
                    myself.applicationID, dataID, imageID, successfulFileUpload, failedFileUpload);
            }
        }
        let failedPreProjectSave = function (data) {
            myself.alertUser('There was an error with saving. Please try again.', 3500);
            console.error(`Note to Developer: Cloud saving pre project save failed.`);
            console.error(`Error Message: ${data}`)
        }
        this.saveFile(projectForm, successfulPreProjectSave, failedPreProjectSave);
    }

    let failedPreImageSave = function (data) {
        myself.alertUser('There was an error with saving. Please try again.', 3500);
        console.error(`Note to Developer: Cloud saving pre image save failed.`);
        console.error(`Error Message: ${data}`)
    }

    this.saveFile(imageForm, successfulPreImageSave, failedPreImageSave);
}




// Helper functions for Cornrow Curves, Navajo Rug Weaver, Northwest Basket Weaver, Virtual Beadloom
// Kindly donated by http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
let dataURItoBlob = function (dataURI, type) {
    var binary;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        binary = atob(dataURI.split(',')[1]);
    else
        binary = unescape(dataURI.split(',')[1]);
    //var binary = atob(dataURI.split(',')[1]);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {
        type: type
    });
}

let dataToBlob = function (data, type) {
    let data_str;
    if (type.includes('image')) {
        data_str = data.toDataURL();
        return dataURItoBlob(data_str, 'image/png');
    } else {
        data_str = serializeData(data);
        return new Blob([data_str], {
            type: 'application/json',
        });
    }
}

let serializeData = function (data) {
    return JSON.stringify(data.map((b) => b.serialize()));
}





// Check for a current project based on the config project id
Cloud.prototype.checkForCurrentProject = function () {
    const myself = this;
    try {
        if (Number.isInteger(Number(config.project.id))) {
            myself.loadFromCloud(config.project.id);
        }
    } catch (err) {
        console.error(err);
    }
};




Cloud.prototype.updateLayout = function () {

    let currentUserProfileURL = `/users/${globals.currentUserID}`;
    let currentUserClassroomsURL = `${currentUserProfileURL}/classes`;

    // Update navigation to either show the sign in / login, or the username
    $(`#${cloudUI.navSignUp}`).attr('hidden', globals.isLoggedIn);
    $(`#${cloudUI.navUserStatus}`).html(`<i class='${globals.isLoggedIn ? 'fas' :'far'} fa-user'></i>&nbsp; ${globals.isLoggedIn ? globals.currentUsername : 'Login'}`);
    $(`#${cloudUI.navUserProjects}`).attr('href', globals.isLoggedIn ? currentUserProfileURL : '');
    $(`#${cloudUI.navUserClassrooms}`).attr('href', globals.isLoggedIn ? currentUserClassroomsURL : '');
    $(`#${cloudUI.navSignOut}`).attr('hidden', !globals.isLoggedIn);

    $(`#${cloudUI.navUserStatus}`).addClass(globals.isLoggedIn ? 'dropdown-toggle' : '');
    $(`#${cloudUI.navUserStatus}`).removeClass(!globals.isLoggedIn ? 'dropdown-toggle' : '');
    $(`#${cloudUI.navUserStatus}`).attr('data-toggle', globals.isLoggedIn ? 'dropdown' : 'modal');
    $(`#${cloudUI.navUserStatus}`).attr('data-target', globals.isLoggedIn ? '' : '#signInPrompt');
    $(`#${cloudUI.navUserStatus}`).attr('aria-expanded', false);
    // $(`#${cloudUI.navUserStatus}`).attr('aria-haspopup', globals.isLoggedIn);
    $(`#${cloudUI.navUserDropdown}`).removeClass(!globals.isLoggedIn ? 'show' : '');
    $(`#${cloudUI.navUserContainer}`).removeClass(!globals.isLoggedIn ? 'show' : '');
    if (!globals.isLoggedIn) {
        $(`#${cloudUI.navUserStatus}`).dropdown('dispose');
    }

    // $(`#${cloudUI.navUserStatus}`).attr('href', globals.isLoggedIn ? '#' : '');

    // Set the state of project saves (either having users login first or allow them to save)
    $(`#${cloudUI.saveProjectSubmit}`).attr('hidden', !globals.isLoggedIn);
    $(`#${cloudUI.saveProjectSignIn}`).attr('hidden', globals.isLoggedIn);

    // Set the state of project loads (either having users login first or allow them to load project)
    $(`#${cloudUI.loadProjectSubmit}`).attr('hidden', !globals.isLoggedIn);
    $(`#${cloudUI.loadProjectSignIn}`).attr('hidden', globals.isLoggedIn);
    $(`#${cloudUI.loadProjectMsg}`).html(globals.isLoggedIn ? '' : 'Sign in to view your projects');
    $(`#${cloudUI.loadProjectMsg}`).attr('hidden', globals.isLoggedIn);
    $(`#${cloudUI.loadProjectLoader}`).addClass(globals.isLoggedIn ? 'd-flex' : 'd-none');
    $(`#${cloudUI.loadProjectLoader}`).removeClass(!globals.isLoggedIn ? 'd-flex' : 'd-none');

    //Set the state of the save confirmation alert
    $(`#${cloudUI.saveConfirmedSubmit}`).attr('hidden', !globals.isLoggedIn);
    $(`#${cloudUI.saveConfirmedSignIn}`).attr('hidden', globals.isLoggedIn);
    $(`#${cloudUI.saveConfirmMsg}`).html(globals.isLoggedIn ? 'Are you sure you want to replace your current project?' : 'Sign in to save your work.');


}





/**
 * Handles and updates the project list
 * @param {boolean} pullFromAPI Default is true to pull a new project list from API, false to append to current list
 */
Cloud.prototype.updateProjectListing = function (pullFromAPI = true) {

    let userProjectList = $(`#${cloudUI.loadProjectList}`);

}

//     let projectListDiv = document.getElementById(constants.project_list);

//     // First, double check if the user is logged in
//     if (globals.userID == "") {
//         // Reset project list for a non-logged in user
//         projectListDiv.innerHTML = '<option selected>Sign in to view projects.</option>';
//         $(`#${constants.project_list}`).attr('disabled', true);
//         $(`#${constants.project_load_alert}`).attr('hidden', true);

//     } else {
//         //Reset project list for a project list update
//         $(`#${constants.project_load_alert}`).attr('hidden', false);
//         projectListDiv.innerHTML = '<option selected>Choose...</option>';

//         // Create a list from scratch
//         let createProjectList = function (projects) {

//             if (projects.length == 0) {
//                 projectListDiv.innerHTML = '<option selected>No projects found.</option>';
//             } else {
//                 projectListDiv.innerHTML = '';

//                 // projects will be sorted first here
//                 projects.forEach(function (project) {
//                     if (project.application == applicationID) {
//                         let projectDiv = document.createElement('option');
//                         projectDiv.innerText = project.name
//                         projectListDiv.appendChild(projectDiv);

//                         projectDiv.value = project.id;
//                         if (projectDiv.value == globals.projectID) {
//                             let att = document.createAttribute("selected");
//                             projectDiv.setAttributeNode(att);
//                         }
//                     }
//                 });
//                 // Adjust GUI elements for project load modal
//                 $('<option selected>Choose...</option>').prependTo($(`#${constants.project_list}`));
//                 $(`#${constants.project_list}`).attr('disabled', false);
//                 $(`#${constants.project_load_alert}`).attr('hidden', true);
//             }


//         }

//         // Add to the list if they created a new project
//         let appendProjectList = function () {

//             let appendProjectDiv = document.createElement('option');
//             appendProjectDiv.innerText = globals.projectName;
//             projectListDiv.appendChild(appendProjectDiv);

//             appendProjectDiv.value = globals.projectID;

//             let att = document.createAttribute("selected");
//             appendProjectDiv.setAttributeNode(att);
//         }

//         // If there was an error with grabbing the project list
//         let error = function (err) {
//             console.error(err);
//         }

//         // if pulling the entire list of projects from api, create new list, else append to it
//         if (pullFromAPI) {
//             this.cloud.listProject(this.cloud.userID, createProjectList, error);
//         } else {
//             appendProjectList();
//         }
//     }
// };

/**
 * Allows you to create messages for the user (i.e. alerting them that they were successful in saving)
 * @param {string} message What message do you want to display
 * @param {number} timeout How long do you want to have the message active for (no number will keep it on the screen indefinitely)
 */
Cloud.prototype.alertUser = function (message, timeout) {

    $(`#${cloudUI.userAlertMsg}`).html(message);
    $(`#${cloudUI.userAlertModal}`).modal('show');

    if (timeout > 0) {
        setTimeout(function () {
            $(`#${cloudUI.userAlertModal}`).modal('hide');
        }, timeout);
    }

}



function togglePasswordVisibility(forceHidden = false) {
    let eyeStatus = forceHidden ? false : $(`#${cloudUI.passwordEyeIcon}`).hasClass('fa-eye-slash');
    $(`#${cloudUI.passwordEyeIcon}`).removeClass(eyeStatus ? 'fa-eye-slash' : 'fa-eye');
    $(`#${cloudUI.passwordEyeIcon}`).addClass(eyeStatus ? 'fa-eye' : 'fa-eye-slash');
    $(`#${cloudUI.passwordField}`).attr('type', eyeStatus ? 'text' : 'password');
}

function setLoadingOverlay(isHidden, hasTimeout = false) {

    $(`.${cloudUI.loadingOverlay}`).attr('hidden', isHidden);

    if (hasTimeout) {
        setTimeout(function () {
            $(`.${cloudUI.loadingOverlay}`).attr('hidden', true);
        }, 3000);
    }



}


// printApplicationPage: Prints the page in landscape for the user
let printApplicationPage = () =>{
    // Injects styke into the document in order for window.print() to print in landscape
    let css = '@page { size: landscape; }',
        head = document.head || document.getElementsByTagName('head')[0],
        style = document.createElement('style');

    style.type = 'text/css';
    style.media = 'print';

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
 let downloadStringAsFile = (filename, text) => {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


// let csdtCloud = new Cloud(99);


// FOR TESTING ONLY


$(`#trigger-overlay`).on('click', () => {
    setLoadingOverlay(false, true);
})

function toggleCurrentUser() {
    globals.isLoggedIn = !globals.isLoggedIn;

    globals.currentUserID = globals.isLoggedIn ? 59 : '';
    globals.currentUsername = globals.isLoggedIn ? 'localtest' : '';

    if (typeof csdtCloud != "undefined") {
        if (csdtCloud instanceof Cloud) {
            csdtCloud.updateLayout();
            $(`#toggle-current-user`).html(`${globals.isLoggedIn ? 'Disable' : 'Enable'} User`);
        }
    }

}

$(`#toggle-current-user`).on('click', () => {
    toggleCurrentUser();
});