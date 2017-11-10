function CloudSaver(optionalProjAPIURL,
                     optionalFileAPIURL,
                     optionalLoginUrl,
                     optionalLoadProjURL,
                     optionalUserAPIURL
                   )
{
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
};

CloudSaver.prototype.login = function(username, password, callBack, errorCallBack)
{
   $.post(this.loginUrl, {'login': username, 'password': password}, callBack).fail(errorCallBack);
};

CloudSaver.prototype.getCSRFToken = function() {
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
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
};

CloudSaver.prototype.saveFile = function(file, callBack, errorCallBack)
{
  $.ajax({
    type: 'PUT',
    url: this.fileAPIURL,
    data: file,
    processData: false,
    contentType: false,
    success:
        function(data) {
            callBack(data);
        }
  }).fail(errorCallBack);
};

CloudSaver.prototype.createProject = function(projectName, applicationID, dataID, imgID, callBack, errorCallBack)
{
    $.post(this.projAPIURL, {
        name: projectName,
        description: '',
        classroom: '',
        application: applicationID,
        project: dataID,
        screenshot: imgID
    }, callBack, 'json').fail(errorCallBack);
};

CloudSaver.prototype.updateProject = function(projectID, projectName, applicationID, dataID, imgID, callBack, errorCallBack)
{
    $.ajax({
      type: 'PUT',
      url: this.projAPIURL+projectID+"/",
      data: {
          name: projectName,
          description: '',
          classroom: null,
          application: applicationID,
          project: dataID,
          screenshot: imgID
      },
      success:
          function(data) {
              callBack(data);
          },
      dataType: 'json'
  }).fail(errorCallBack);
};

CloudSaver.prototype.updateProject = function(projectID, projectName, applicationID, dataID, imgID, callBack, errorCallBack)
{
    $.ajax({
      type: 'PUT',
      url: this.projAPIURL+projectID+"/",
      data: {
          name: projectName,
          description: '',
          classroom: null,
          application: applicationID,
          project: dataID,
          screenshot: imgID
      },
      success:
          function(data) {
              callBack(data);
          },
      dataType: 'json'
  }).fail(errorCallBack);
};

CloudSaver.prototype.loadProject = function(projID, callBack, errorCallBack) {
    $.get(this.projAPIURL + projID + '/', null, function(data) {
      $.get(data.project_url, null,
        function(data) {
            callBack(data);
        }).fail(errorCallBack);
    }).fail(errorCallBack);
};

CloudSaver.prototype.listProject = function(userID, callBack, errorCallBack) {
  $.get(this.projAPIURL+"?owner="+userID, null,
        function(data) {
            callBack(data);
        }, "json").fail(errorCallBack);
};

CloudSaver.prototype.getUser = function(callBack, errorCallBack) {
   this.getCSRFToken();
   $.ajax({
      dataType: "json",
      url: this.userAPIURL,
      success: function(data) {
          callBack(data);
      }
   });
};
