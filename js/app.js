(function () {
    var API = window.APPDOTNET;
    
    // Initialize template
    var alertSource   = $("#alert-template").html();
    var alertTemplate = Handlebars.compile(alertSource);

    var init_authorize = function () {
        console.log('initializing authorize');
        $('.js-authorize-click').on('click', function () {
            // If the user isn't authorized wait for them to click on the authorize links
            // then send them through the app.net api
            var url = API.get_authorization_url(NOTIFIER_OPTIONS);
            window.location.href = url;
        });
    };

    var init_notifications = function () {

        NOTIFIER_OPTIONS.access_token = window.localStorage.access_token;
        API = API.init(NOTIFIER_OPTIONS);
        var authorize = $('.js-authorize');
        var running = $('.js-running');
        var profileMenu = $('.js-profileMenu');
        var last_message_time = 0;

        var swap_panels = function () {
            authorize.addClass('hide');
            running.removeClass('hide');
            profileMenu.removeClass('hide');
        };
        
        API.users().done(function (data) {
            //running.find('.authorized-user').css({
            //    'background-image': 'url(' + data.data.cover_image.url + ')'
            //});
            profileMenu.find('.js-username').text(data.data.username);
            //running.find('.js-user-bio').html(data.data.description.html);
            swap_panels();
        });
        /* not needed anymore, I think
        if (!window.webkitNotifications) {
          alert("Notifications are not supported for this Browser/OS version yet.");
          return;
        }

        if (window.webkitNotifications.checkPermission() !== 0) {
            $('.js-ask-permission').addClass('show').on('click', '.js-request-notifications', function () {
                window.webkitNotifications.requestPermission(function () {
                    init_notifications();
                    return false;
                });
            });

            return false;
        }
*/
        var poll_for_new_messages = function (callback) {
            API.messages().done(function (data) {
                callback(data);
            });
        };

        poll_for_new_messages(function (data) {
            $.each(data.data, function (i, el) {
                date = 0 + Date.parse(el.created_at);
                if (date > last_message_time) {
                    last_message_time = date;
                }
            });
        });
        

        var announce = function (message) {
            
            console.log('new message', message);
            
            var data = {alertTitle: "Message Alert", alertText: message.text}
            
            $("#alert-section").append(alertTemplate(data));
            
            
            /*
            $('.js-messageUser').text(message.user.username);
            $('.js-messageText').text(message.text);
            $("#alertTemplate").addClass("in");
            
            
            
            var notification = window.webkitNotifications.createNotification(
                message.user.avatar_image.url,
                message.user.username + ' messageed you on App.net',
                message.text
            );

            notification.onshow  = notification.ondisplay = function() { setTimeout(function() { notification.cancel(); }, 4000); };

            notification.onclick = function () {
                window.open('https://alpha.app.net/' + message.user.username + '/post/' + message.id, '_blank');
            };

            notification.show();
            */
        };


        setInterval(function () {
            poll_for_new_messages(function (data) {
                console.log(data);
                
                //for easy debugging
                //announce(data.data[0]);
                
            
                $.each(data.data, function (i, el) {
                    date = 0 + Date.parse(el.created_at);
                    if (date > last_message_time) {
                        last_message_time = date;
                        announce(el);
                    }
                });
                
            });
        }, 5000);


    };

    if (window.location.hash !== '' && !window.localStorage.access_token) {
        var keys = URI('?' + window.location.hash.slice(1)).query(true);
        if (keys && keys.access_token) {
            window.localStorage.access_token = keys.access_token;
        }
    }

    if (window.localStorage.access_token) {
        init_notifications();
    } else {
        init_authorize();
    }
}());