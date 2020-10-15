/* eslint-disable */
let rwCloud = new CloudSaver();

var RhythmWheelsCloud;

function RhythmWheelsCloud(optionalProjAPIURL,
    optionalFileAPIURL,
    optionalLoginUrl,
    optionalLoadProjURL,
    optionalUserAPIURL,
    optionalGISDSURL,
    optionalGISPolyURL,
    optionalGISPointURL,
    optionalLogoutAPIURL) {
    if (optionalProjAPIURL) this.ProjAPIURL = optionalProjAPIURL;
    else this.projAPIURL = '/api/projects/';
    if (optionalFileAPIURL) this.fileAPIURL = optionalFileAPIURL;
    else this.fileAPIURL = '/api/files/';
    if (optionalLoginUrl) this.loginUrl = optionalLoginUrl;
    else this.loginUrl = '/accounts/login/';
    if (optionalLoadProjURL) this.loadProjURL = optionalLoginUrl;
    else this.loadProjURL = '/projects/';
    if (optionalUserAPIURL) this.userAPIURL = optionalUserAPIURL;
    else this.userAPIURL = '/api/user';
    if (optionalUserAPIURL) this.gisDSURL = optionalGISDSURL;
    else this.gisDSURL = '/api-gis/api-ds/';
    if (optionalUserAPIURL) this.gisPolyURL = optionalGISPolyURL;
    else this.gisPolyURL = '/api-gis/api-poly/';
    if (optionalUserAPIURL) this.gisPointURL = optionalGISPointURL;
    else this.gisPointURL = '/api-gis/api-mp/';
    if (optionalLogoutAPIURL) this.logoutAPIURL = optionalLogoutAPIURL;
    else this.logoutAPIURL = '/accounts/logout/';
    this.getCSRFToken();
}


/** Use this to allow other API calls besides login */
RhythmWheelsCloud.prototype.getCSRFToken = function () {
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
RhythmWheelsCloud.prototype.getUser = function (callBack, errorCallBack) {
    $.ajax({
        dataType: 'json',
        url: this.userAPIURL,
        success: callBack,
    }).fail(errorCallBack);
};


RhythmWheelsCloud.prototype.login = function (modal, globals, success) {
    this.getCSRFToken();
    this.alertMessage('Logging you in...', modal, true);
    let loginSuccess = function (data) {
        globals.userID = data.id;
        globals.userName = data.username;
        success();
    }
    let loginError = function (error) {
        console.error(error);
    }
}

RhythmWheelsCloud.prototype.alertMessage = function (message, modal, show, timeout = false, duration = 0) {
    $(`#${modal} .modal-dialog .alert strong`).html(message);

    if (timeout) {
        setTimeout(function () {
            $(`#${modal}`).modal(show ? 'show' : 'hide');
        }, duration);


    } else {
        $(`#${modal}`).modal(show ? 'show' : 'hide');
    }
}

RhythmWheelsCloud.prototype.checkForCurrentUser = function (globals, flags, succ) {
    let success = function (data) {
        if (data.id === null) {
            globals.userID = -1;
            globals.userName = ''
            flags.loggedIn = false;
        } else {
            globals.userID = data.id;
            globals.userName = data.username;
            flags.loggedIn = true;
        }
        succ();
    };
    let error = function (data) {
        console.error(data);
    };

    this.getUser(success, error);

}

RhythmWheelsCloud.prototype.checkForCurrentProject = function (globals, flags, succ) {
    try {
        if (Number.isInteger(Number(config.project.id))) {
            this.alertMessage('Loading Project...', constants.alertModal, true);
            succ(config.project.id);
            
        }
    } catch (err) {
        console.error(err);
    }

}

RhythmWheelsCloud.prototype.updateURL = function (URL) {

    if (window.history !== undefined && window.history.pushState !== undefined) {
        window.history.pushState({}, "", '/projects/' + URL + "/run");
    }
};


RhythmWheelsCloud.prototype.projectUpdateStatus = function(flag, bool){
    flag = bool;
}

// var cloudLogin = function (cb) {
//     rwCloud.getCSRFToken();
//     console.log('cloud login');
//     let success = function (data) {
//         alert('You have successfully logged in');
//         rw.globals.userID = data.id;
//         rw.globals.userName = data.username;
//         return cb(null, {
//             success: true,
//         });
//     };

//     let error = function (data) {
//         return cb(data, {
//             success: false,
//         });
//     };

//     rwCloud.loginPopup(success, error);
// };


// // functions to log the user in/out and update the ui accordingly
// var login = this.login = function () {
//     cloudLogin(function (err0, res0) {
//         if (!err0) {
//             cloudListProjects(function (err1, res1) {
//                 updateProjectList(res1);
//             });
//             updateLoginStatus(true);
//         } else {
//             console.error(err0);
//             alert('Incorrect username or password. Please try again.');
//             updateLoginStatus(false);
//         }
//     });
// };


// var checkLoginStatus = function (globals, flags) {
//     let success = function (data) {
//         if (data.id === null) {
//             console.log('Not Logged In');
//             updateUserGUI(false, globals,flags);
//         } else {
//             globals.userID = data.id;
//             globals.userName = data.username;
//             updateUserGUI(true, globals, flags);
//             cloud.listProject(globals.userID, function (data) {
//                 updateProjectList(data);
//             }, function (data) {
//                 console.log('No projects');
//             });
//         }
//     };
//     let error = function (data) {
//         console.error(data);
//     };

//     cloud.getUser(success, error);
// };


// let submitLogin = function (cb) {
//     cloud.getCSRFToken();
//     let username = $(constants.userName).val();
//     let password = $(constants.userPass).val();

//     let success = function (data) {
//         globals.userID = data.id;
//         globals.userName = data.username;
//         return cb(null, {
//             success: true,
//         });
//     };

//     let error = function (data) {
//         return cb(data, {
//             success: false,
//         });
//     };



//     cloud.login(username, password, function (data) {
//             cloud.getUser(success, error);
//         },
//         error
//     );

// };



// let login = this.login = function () {

//     $(constants.loginModal).modal('hide');
//     updateAlert('Logging you in...');


//     submitLogin(function (err0, res0) {
//         if (!err0) {
//             flags.loggedIn = true;
//             getUserProjects();
//             updateAlert('You are now logged in!', true, 1000);
//             updateUserGUI();

//         } else {
//             flags.loggedIn = false;
//             console.error(err0);
//             updateAlert('Incorrect username or password. Please try again.', true, 2000);
//             updateModal(constants.loginModal, true, true, 2000);
//         }
//     });
// };