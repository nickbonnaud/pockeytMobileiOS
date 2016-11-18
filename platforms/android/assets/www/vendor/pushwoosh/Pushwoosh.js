function initPushwoosh() {
    var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");
    
    if (device.platform == "iPhone" || device.platform == "iOS") {
        //set push notification callback before we initialize the plugin
        document.addEventListener('push-notification', function(event) {
            //get the notification payload
            var notification = event.notification;
            //display alert to the user for example
            navigator.notification.alert(notification.aps.alert, null, 'Pockeyt Message', 'Done');                 
            //clear the app badge
            pushNotification.setApplicationIconBadgeNumber(0);
        });
        //initialize the plugin
        pushNotification.onDeviceReady({pw_appid:"6D6A3-A5078"});
        //register for pushes
        pushNotification.registerDevice(
            function(status) {
                var deviceToken = status['deviceToken'];
                console.warn('registerDevice: ' + deviceToken);
            },
            function(status) {
                console.warn('failed to register : ' + JSON.stringify(status));
            }
        );
        //reset badges on app start
        pushNotification.setApplicationIconBadgeNumber(0);
    }

    if (device.platform == "Android") {
        //set push notifications handler
        document.addEventListener('push-notification', function(event) {
            var title = event.notification.title;
            var userData = event.notification.userdata;
                                   
            if(typeof(userData) != "undefined") {
              console.warn('user data: ' + JSON.stringify(userData));
            }
                                       
            navigator.notification.alert(title, null, 'Pockeyt Message', 'Done');
        });

        //initialize Pushwoosh with projectid: "GOOGLE_PROJECT_NUMBER", pw_appid : "PUSHWOOSH_APP_ID". This will trigger all pending push notifications on start.
        pushNotification.onDeviceReady({ projectid: "906488292868", pw_appid: "6D6A3-A5078" });

        //register for pushes
        pushNotification.registerDevice(
            function(status) {
                var pushToken = status;
                console.warn('push token: ' + pushToken);
            },
            function(status) {
                console.warn(JSON.stringify(['failed to register ', status]));
            }
        );
    }
}


