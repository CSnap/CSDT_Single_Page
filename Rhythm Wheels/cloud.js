/* eslint-disable */
function CloudRW(){
    this.init();
    this.getCSRFToken();
}

CloudRW.prototype.init = function () {
    this.apiBasePath = '/api';
    this.url = this.determineCloudDomain();
    this.username = null;
    this.user_id = null;
    this.application_id = 90;
    this.classroom_id = '';
    this.dataID = '';
    this.imgID = 1000;

    if (typeof config !== 'undefined') {
        if (config.urls !== undefined) {
            if (config.urls.create_project_url !== undefined) {
                this.create_project_url = config.urls.create_project_url;
            }
            if (config.urls.create_file_url !== undefined) {
                this.create_file_url = config.urls.create_file_url;
            }
            if (config.urls.list_project_url !== undefined) {
                this.list_project_url = config.urls.list_project_url;
            }
            if (config.urls.login_url !== undefined) {
                this.login_url = config.urls.login_url
            }
            if (config.urls.user_detail_url !== undefined) {
                this.user_detail_url = config.urls.user_detail_url;
            }
            this.user_api_detail_url = config.urls.user_api_detail_url;
            if (config.urls.project_url_root !== undefined) {
                this.project_url_root = config.urls.project_url_root;
            }
        }

        if (config.project !== undefined) {
            if (config.project.project_url !== undefined) {
                this.project_url = config.project.project_url;
            }
            if (config.project.id !== undefined) {
                this.project_id = config.project.id;
            }
            if (config.project.approved !== undefined) {
                this.project_approved = config.project.approved;
            }
        }
    }


};

// Projects larger than this are rejected.
CloudRW.MAX_FILE_SIZE = 10 * 1024 * 1024;

CloudRW.prototype.knownDomains = {
    'Snap!Cloud': '',
    'localhost': 'http://localhost:8080',
    'localhost (secure)': 'https://localhost:4431'
};

CloudRW.prototype.defaultDomain = CloudRW.prototype.knownDomains['Snap!Cloud'];

CloudRW.prototype.determineCloudDomain = function () {
    // We dynamically determine the domain of the cloud server.
    // This allows for easy mirrors and development servers.
    // The domain is determined by:
    // 1. <meta name='snap-cloud-domain' location="X"> in snap.html.
    // 2. The current page's domain
    var currentDomain = window.location.host, // host includes the port.
        metaTag = document.head.querySelector("[name='snap-cloud-domain']"),
        cloudDomain = this.defaultDomain,
        domainMap = this.knownDomains;

    if (metaTag) {
        return metaTag.getAttribute('location');
    }

    Object.keys(domainMap).some(function (name) {
        var server = domainMap[name];
        if (CloudRW.isMatchingDomain(currentDomain, server)) {
            cloudDomain = server;
            return true;
        }
        return false;
    });

    return cloudDomain;
};

CloudRW.isMatchingDomain = function (client, server) {
    // A matching domain means that the client-server are not subject to
    // 3rd party cookie restrictions.
    // see https://tools.ietf.org/html/rfc6265#section-5.1.3
    // This matches a domain at end of a subdomain URL.
    var position = server.indexOf(client);
    switch (position) {
        case -1:
            return false;
        case 0:
            return client === server;
        default:
            return /[\.\/]/.test(server[position - 1]) &&
                server.length === position + client.length;
    }
};

// Dictionary handling

CloudRW.prototype.parseDict = function (src) {
    var dict = {};
    if (!src) {
        return dict;
    }
    src.split("&").forEach(function (entry) {
        var pair = entry.split("="),
            key = decodeURIComponent(pair[0]),
            val = decodeURIComponent(pair[1]);
        dict[key] = val;
    });
    return dict;
};

CloudRW.prototype.encodeDict = function (dict) {
    var str = '',
        pair,
        key;
    if (!dict) {
        return null;
    }
    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            pair = encodeURIComponent(key) +
                '=' +
                encodeURIComponent(dict[key]);
            if (str.length > 0) {
                str += '&';
            }
            str += pair;
        }
    }
    return str;
};

// Error handling

CloudRW.genericErrorMessage =
    'There was an error while trying to access\n' +
    'a cloud service. Please try again later.';

CloudRW.prototype.genericError = function () {
    throw new Error(CloudRW.genericErrorMessage);
};



// Low level functionality

CloudRW.prototype.request = function (
    method,
    path,
    onSuccess,
    onError,
    errorMsg,
    wantsRawResponse,
    body) {



    var request = new XMLHttpRequest(),
        myself = this,
        fullPath = this.url +
        (path.indexOf('%user_id') > -1 ?
            path.replace('%user_id', encodeURIComponent(this.user_id)) :
            path);
    try {
        request.open(
            method,
            fullPath,
            true
        );
        request.setRequestHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );
        // request.setRequestHeader('X-CSRFToken', csrftoken);
        request.withCredentials = true;
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.responseText) {
                    var response =
                        (!wantsRawResponse ||
                            (request.responseText.indexOf('{"errors"') === 0)) ?
                        JSON.parse(request.responseText) :
                        request.responseText;

                    if (response.errors) {
                        onError.call(
                            null,
                            response.errors[0],
                            errorMsg
                        );
                    } else {
                        if (onSuccess) {
                            onSuccess.call(null, response.message || response);
                        }
                    }
                } else {
                    if (onError) {
                        onError.call(
                            null,
                            errorMsg || CloudRW.genericErrorMessage,
                            myself.url
                        );
                    } else {
                        myself.genericError();
                    }
                }
            }
        };
        request.send(body);
    } catch (err) {
        onError.call(this, err.toString(), 'Cloud Error');
    }
};

CloudRW.prototype.withCredentialsRequest = function (
    method,
    path,
    onSuccess,
    onError,
    errorMsg,
    wantsRawResponse,
    body) {

    var myself = this;
    this.checkCredentials(
        function (username) {
            if (username) {
                myself.request(
                    method,
                    // %username is replaced by the actual username
                    path,
                    onSuccess,
                    onError,
                    errorMsg,
                    wantsRawResponse,
                    body);
            } else {
                onError.call(this, 'You are not logged in', 'Snap!Cloud');
            }
        }
    );
};

// Credentials management

CloudRW.prototype.checkCredentials = function (onSuccess, onError, response) {
    var myself = this;
    this.getCurrentUser(
        function (user) {
            if (user.username) {
                myself.username = user.username;
                // globals.userName = user.username;
                myself.user_id = user.id;
                // globals.userID = user.id;
                myself.verified = true; //Since we don't have verified statuses for users, forcing true for now...
            }
            if (onSuccess) {
                onSuccess.call(
                    null,
                    user.username,
                    user.id,
                    user.role,
                    response ? JSON.parse(response) : null
                );
            }
        },
        onError
    );
};

CloudRW.prototype.getCurrentUser = function (onSuccess, onError) {
    this.request(
        'GET',
        this.apiBasePath + '/users/c',
        onSuccess,
        onError,
        'Could not retrieve current user'
    );
};

CloudRW.prototype.getUser = function (username, onSuccess, onError) {
    this.request(
        'GET',
        this.apiBasePath + '/users/' + encodeURIComponent(username),
        onSuccess,
        onError,
        'Could not retrieve user'
    );
};

CloudRW.prototype.logout = function (onSuccess, onError) {
    this.username = null;
    this.getCSRFToken();
    $.post('/accounts/logout/', {}, onSuccess, 'json').fail(onError);
};

CloudRW.prototype.login = function (
    username,
    password,
    persist,
    onSuccess,
    onError
) {
    var myself = this;
    let myCallBack = function (data, textStatus, jqXHR) {
        myself.getCSRFToken();
        $.ajax({
            dataType: "json",
            url: myself.apiBasePath + '/user',
            success: function (data) {
                myself.user_id = data.id;
                myself.username = data.username;
                onSuccess(data, textStatus, jqXHR);
            },
        });

    };
    myself.getCSRFToken();
    $.post('/accounts/login/', {
        'login': username,
        'password': password
    }, myCallBack).fail(function (errorCall) {
        alert("Your username or password was incorrect. Please try again.");
        return errorCall;
    });
};

CloudRW.prototype.signup = function (
    username,
    password,
    passwordRepeat,
    email,
    onSuccess,
    onError
) {
    this.request(
        'POST',
        '/users/' + encodeURIComponent(username) + '?' + this.encodeDict({
            email: email,
            password: hex_sha512(password),
            password_repeat: hex_sha512(passwordRepeat)
        }),
        onSuccess,
        onError,
        'signup failed');
};


CloudRW.prototype.updateURL = function (URL) {
    if (window.history !== undefined && window.history.pushState !== undefined) {
        window.history.pushState({}, "", "/projects/" + URL + "/run");
    }
};

CloudRW.prototype.dataURItoBlob = function (dataURI, type) {
    let binary;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        binary = atob(dataURI.split(',')[1]);
    else
        binary = unescape(dataURI.split(',')[1]);
    //var binary = atob(dataURI.split(',')[1]);
    let array = [];
    for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {
        type: type
    });
}


// Projects

CloudRW.prototype.saveProject = function (projectName, body, onSuccess, onError) {
    // Expects a body object with the following paramters:
    // xml, media, thumbnail, remixID (optional), notes (optional)
    var myself = this;
    this.checkCredentials(
        function (username) {
            if (username) {
                let xml_string = 'data:text/xml,' + encodeURIComponent(body.xml);
                let xml_blob = myself.dataURItoBlob(xml_string, 'text/xml');
                let xml = new FormData();
                xml.append('file', xml_blob);

                let img_string = body.thumbnail;
                let img_blob = myself.dataURItoBlob(img_string, 'image/png');
                let img = new FormData();
                img.append('file', img_blob);

                let xml_id, img_id;
                let completed = 0;

                let successXML = function (data) {
                    completed++;
                    xml_id = data.id;
                    if (completed === 2) {
                        myself.createProject(projectName, xml_id, img_id, onSuccess, onError);
                    }
                }

                let successIMG = function (data) {
                    completed++;
                    img_id = data.id;
                    if (completed === 2) {
                        myself.createProject(projectName, xml_id, img_id, onSuccess, onError);
                    }
                }

                myself.saveFile(img, successIMG, onError);
                myself.saveFile(xml, successXML, onError);


            } else {
                onError.call(this, 'You are not logged in', 'Snap!Cloud');
            }
        }
    );
};

CloudRW.prototype.saveFile = function (file, onSuccess, onError) {
    $.ajax({
        type: 'PUT',
        url: this.apiBasePath + '/files/',
        data: file,
        processData: false,
        contentType: false,
        success: onSuccess,
    }).fail(onError);
};

CloudRW.prototype.createProject = function (projectName, dataNum, imgNum, onSuccess, onError) {
    console.log(this.project_id);
    if (this.project_id !== null) {
        $.ajax({
            type: 'PUT',
            url: this.apiBasePath + '/projects/' + this.project_id + '/',
            data: {
                name: projectName,
                description: '',
                classroom: dataNum.classroom_id,
                application: this.application_id,
                project: dataNum,
                screenshot: imgNum
            },
            success: onSuccess,
            dataType: 'json'
        }).fail(onError);
    } else {
        $.post(this.apiBasePath + '/projects/', {
            name: projectName,
            description: '',
            classroom: this.classroom_id,
            application: this.application_id,
            project: dataNum,
            screenshot: imgNum,
        }, onSuccess, 'json').fail(onError);
    }


}

CloudRW.prototype.getProjectList = function (onSuccess, onError) {
    var path = this.apiBasePath + '/projects/?owner=%user_id';

    this.withCredentialsRequest(
        'GET',
        path,
        onSuccess,
        onError,
        'Could not fetch projects'
    );
};

CloudRW.prototype.getPublishedProjectList = function (
    username,
    page,
    pageSize,
    searchTerm,
    onSuccess,
    onError,
    withThumbnail
) {
    var path = this.apiBasePath + '/projects' +
        (username ? '/' + encodeURIComponent(username) : '') +
        '?ispublished=true';

    if (!username) {
        // When requesting the global list of published projects, filter out
        // those with project names that are typical of online courses like
        // Teals or BJC. When requesting a user's published projects, show them
        // all.
        path += '&filtered=true';
    }

    if (withThumbnail) {
        path += '&withthumbnail=true';
    }

    if (page) {
        path += '&page=' + page + '&pagesize=' + (pageSize || 16);
    }

    if (searchTerm) {
        path += '&matchtext=' + encodeURIComponent(searchTerm);
    }

    this.request(
        'GET',
        path,
        onSuccess,
        onError,
        'Could not fetch projects'
    );
};

CloudRW.prototype.getThumbnail = function (
    username,
    projectName,
    onSuccess,
    onError
) {
    this[username ? 'request' : 'withCredentialsRequest'](
        'GET',
        this.apiBasePath + '/projects/' +
        (username ? encodeURIComponent(username) : '%user_id') +
        '/' +
        encodeURIComponent(projectName) +
        '/thumbnail',
        onSuccess,
        onError,
        'Could not fetch thumbnail',
        true
    );
};

CloudRW.prototype.getProject = function (proj, delta, onSuccess, onError) {
    this.request(
        'GET',
        proj.project_url,
        onSuccess,
        onError,
        'Could not fetch project ' + proj.id,
        true
    );
};

CloudRW.prototype.getPublicProject = function (
    projectName,
    username,
    onSuccess,
    onError
) {
    this.request(
        'GET',
        '/projects/' +
        encodeURIComponent(username) +
        '/' +
        encodeURIComponent(projectName),
        onSuccess,
        onError,
        'Could not fetch project ' + projectName,
        true
    );
};


CloudRW.prototype.updateProjectName = function (
    projectName,
    newName,
    onSuccess,
    onError
) {
    this.withCredentialsRequest(
        'POST',
        '/projects/%username/' +
        encodeURIComponent(projectName) +
        '/metadata',
        onSuccess,
        onError,
        'Could not update project name',
        false, // wants raw response
        JSON.stringify({
            projectname: newName
        })
    );
};



// Paths to front-end pages
/*
    This list of paths is incomplete, we will add them as necessary.
    Important: a path is a string *without* a domain.
    These paths are not prefixed by `apiBasePath`.
*/

CloudRW.prototype.showProjectPath = function (username, projectname) {
    return '/project?' + this.encodeDict({
        user: username,
        project: projectname
    });
};


CloudRW.prototype.getCSRFToken = function () {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function sameOrigin(url) {
        // test that a given url is a same-origin URL
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
}

CloudRW.prototype.getClassroomList = function (callBack, errorCall) {

    let myself = this;
    this.withCredentialsRequest(
        'GET',
        myself.apiBasePath + "/team/?user=" + myself.user_id,
        callBack,
        errorCall,
        'You must be logged in to view classrooms.'
    );

    // $.get(myself.apiBasePath + "/team/?user=" + myself.user_id, null,
    //     function (data) {
    //         callBack(data);
    //     }, "json").fail(errorCall);



};
